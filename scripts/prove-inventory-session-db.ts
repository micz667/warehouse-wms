/**
 * Discriminating acceptance for F017 — needs Postgres.
 * Inventory session on populated stock: count → variance vs SUM(movements)
 * → approve posts correction movements so balances = counted; re-approve blocked.
 * Opening stocktake path remains intact (separate session still posts openings).
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { postReceipt } from "../src/server/movements/post-receipt";
import { approveStocktakeSession } from "../src/server/stocktake/approve-stocktake-session";
import { createStocktakeSession } from "../src/server/stocktake/create-stocktake-session";
import { getStocktakeSession } from "../src/server/stocktake/list-stocktake-sessions";
import { startStocktakeCounting } from "../src/server/stocktake/start-stocktake-counting";
import { upsertStocktakeLine } from "../src/server/stocktake/upsert-stocktake-line";
import { getStockBalance } from "../src/server/stock/list-stock-balances";

async function main() {
  const suffix = Date.now().toString(36);

  const item = await createCatalogItem(prisma, {
    name: `Inwentaryzacja ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");

  const itemFlat = await createCatalogItem(prisma, {
    name: `Bez odchylenia ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemFlat.ok, true);
  if (!itemFlat.ok) throw new Error("catalog create 2 failed");

  const loc = await createLocation(prisma, {
    code: `INV-${suffix}`,
    label: `Strefa inv ${suffix}`,
  });
  assert.equal(loc.ok, true);
  if (!loc.ok) throw new Error("location create failed");

  // Populate system stock via receipt (not opening) so inventory is against
  // an already populated catalog + movement-sum balance.
  const receiptA = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    qty: 10,
  });
  assert.equal(receiptA.ok, true);

  const receiptB = await postReceipt(prisma, {
    catalogItemId: itemFlat.item.id,
    locationId: loc.location.id,
    qty: 4,
  });
  assert.equal(receiptB.ok, true);

  const beforeA = await getStockBalance(
    prisma,
    item.item.id,
    loc.location.id,
  );
  assert.equal(beforeA.toString(), "10");

  const created = await createStocktakeSession(prisma, {
    note: `Inv prove ${suffix}`,
    kind: "inventory",
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("session create failed");
  assert.equal(created.session.kind, "inventory");
  const sessionId = created.session.id;

  const started = await startStocktakeCounting(prisma, sessionId);
  assert.equal(started.ok, true);

  // Count 7 at system 10 → variance -3; flat line 4 at system 4 → variance 0
  const lineA = await upsertStocktakeLine(prisma, {
    sessionId,
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    countedQty: 7,
  });
  assert.equal(lineA.ok, true);

  const lineFlat = await upsertStocktakeLine(prisma, {
    sessionId,
    catalogItemId: itemFlat.item.id,
    locationId: loc.location.id,
    countedQty: 4,
  });
  assert.equal(lineFlat.ok, true);

  // Acceptance: before approve, session shows variance per counted line
  const detail = await getStocktakeSession(prisma, sessionId);
  assert.ok(detail);
  assert.equal(detail?.kind, "inventory");
  const rowA = detail?.lines.find((l) => l.catalogItemId === item.item.id);
  const rowFlat = detail?.lines.find(
    (l) => l.catalogItemId === itemFlat.item.id,
  );
  assert.equal(rowA?.systemQty, "10");
  assert.equal(rowA?.variance, "-3");
  assert.equal(String(rowA?.countedQty), "7");
  assert.equal(rowFlat?.systemQty, "4");
  assert.equal(rowFlat?.variance, "0");

  const approved = await approveStocktakeSession(prisma, sessionId);
  assert.equal(approved.ok, true);
  if (!approved.ok) throw new Error("approve failed");
  assert.equal(approved.session.status, "approved");
  // Only non-zero variance posts a movement
  assert.equal(approved.movementCount, 1);

  const movements = await prisma.movement.findMany({
    where: { stocktakeSessionId: sessionId },
  });
  assert.equal(movements.length, 1);
  assert.equal(movements[0]?.type, "correction");
  assert.equal(movements[0]?.qty.toString(), "-3");
  assert.equal(movements[0]?.correctsMovementId, null);

  const afterA = await getStockBalance(
    prisma,
    item.item.id,
    loc.location.id,
  );
  assert.equal(afterA.toString(), new Decimal("7").toString());

  const afterFlat = await getStockBalance(
    prisma,
    itemFlat.item.id,
    loc.location.id,
  );
  assert.equal(afterFlat.toString(), "4");

  // Re-approve blocked — no double post
  const reapprove = await approveStocktakeSession(prisma, sessionId);
  assert.equal(reapprove.ok, false);
  if (reapprove.ok) throw new Error("expected re-approve blocked");
  assert.equal(reapprove.error, "already_approved");

  const afterRe = await prisma.movement.count({
    where: { stocktakeSessionId: sessionId },
  });
  assert.equal(afterRe, 1, "re-approve must not double-post");

  const still = await getStockBalance(
    prisma,
    item.item.id,
    loc.location.id,
  );
  assert.equal(still.toString(), "7");

  // Opening path still works (F005 prove retained via separate session)
  const openItem = await createCatalogItem(prisma, {
    name: `Otwarcie ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(openItem.ok, true);
  if (!openItem.ok) throw new Error("open catalog failed");

  const openSession = await createStocktakeSession(prisma, {
    kind: "opening",
    note: `Opening prove ${suffix}`,
  });
  assert.equal(openSession.ok, true);
  if (!openSession.ok) throw new Error("open session failed");
  assert.equal(openSession.session.kind, "opening");

  assert.equal(
    (await startStocktakeCounting(prisma, openSession.session.id)).ok,
    true,
  );
  assert.equal(
    (
      await upsertStocktakeLine(prisma, {
        sessionId: openSession.session.id,
        catalogItemId: openItem.item.id,
        locationId: loc.location.id,
        countedQty: 2,
      })
    ).ok,
    true,
  );
  const openApproved = await approveStocktakeSession(
    prisma,
    openSession.session.id,
  );
  assert.equal(openApproved.ok, true);
  if (!openApproved.ok) throw new Error("open approve failed");
  assert.equal(openApproved.movementCount, 1);
  const openMovements = await prisma.movement.findMany({
    where: { stocktakeSessionId: openSession.session.id },
  });
  assert.ok(openMovements.every((m) => m.type === "opening"));
  assert.equal(
    (
      await getStockBalance(prisma, openItem.item.id, loc.location.id)
    ).toString(),
    "2",
  );

  console.log(
    "prove-inventory-session-db: ok (variance shown · correction posts · re-approve blocked · opening intact)",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
