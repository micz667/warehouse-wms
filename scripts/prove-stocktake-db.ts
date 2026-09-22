/**
 * Discriminating acceptance for F005 — needs Postgres.
 * Approving a session posts opening movements equal to counted qty;
 * re-approve and edit after approve are blocked; stock sum matches.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { approveStocktakeSession } from "../src/server/stocktake/approve-stocktake-session";
import { createStocktakeSession } from "../src/server/stocktake/create-stocktake-session";
import { startStocktakeCounting } from "../src/server/stocktake/start-stocktake-counting";
import { upsertStocktakeLine } from "../src/server/stocktake/upsert-stocktake-line";
import {
  getStockBalance,
  listStockBalances,
} from "../src/server/stock/list-stock-balances";

async function main() {
  const suffix = Date.now().toString(36);

  const item = await createCatalogItem(prisma, {
    sku: `SKU-${suffix}`,
    name: `Pozycja spisu ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");

  const item2 = await createCatalogItem(prisma, {
    sku: `SKU2-${suffix}`,
    name: `Druga ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item2.ok, true);
  if (!item2.ok) throw new Error("catalog create 2 failed");

  const loc = await createLocation(prisma, {
    code: `ST-${suffix}`,
    label: `Strefa ${suffix}`,
  });
  assert.equal(loc.ok, true);
  if (!loc.ok) throw new Error("location create failed");

  const created = await createStocktakeSession(prisma, {
    note: `Prove ${suffix}`,
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("session create failed");
  const sessionId = created.session.id;

  const started = await startStocktakeCounting(prisma, sessionId);
  assert.equal(started.ok, true);
  assert.equal(started.ok && started.session.status, "counting");

  const lineA = await upsertStocktakeLine(prisma, {
    sessionId,
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    countedQty: 12.5,
  });
  assert.equal(lineA.ok, true);

  const lineB = await upsertStocktakeLine(prisma, {
    sessionId,
    catalogItemId: item2.item.id,
    locationId: loc.location.id,
    countedQty: 3,
  });
  assert.equal(lineB.ok, true);

  // Inline create during count
  const lineC = await upsertStocktakeLine(prisma, {
    sessionId,
    locationId: loc.location.id,
    countedQty: 1,
    newItem: {
      sku: `INLINE-${suffix}`,
      name: `Inline ${suffix}`,
      category: "Test",
      unit: "szt",
    },
  });
  assert.equal(lineC.ok, true);

  const approved = await approveStocktakeSession(prisma, sessionId);
  assert.equal(approved.ok, true);
  if (!approved.ok) throw new Error("approve failed");
  assert.equal(approved.session.status, "approved");
  assert.equal(approved.movementCount, 3);

  const movements = await prisma.movement.findMany({
    where: { stocktakeSessionId: sessionId },
  });
  assert.equal(movements.length, 3);
  assert.ok(movements.every((m) => m.type === "opening"));

  const sumA = await getStockBalance(prisma, item.item.id, loc.location.id);
  assert.equal(sumA.toString(), new Decimal("12.5").toString());

  const sumB = await getStockBalance(prisma, item2.item.id, loc.location.id);
  assert.equal(sumB.toString(), "3");

  const balances = await listStockBalances(prisma);
  const rowA = balances.find(
    (b) =>
      b.catalogItemId === item.item.id && b.locationId === loc.location.id,
  );
  assert.ok(rowA);
  assert.equal(rowA?.qty, "12.5");

  const reapprove = await approveStocktakeSession(prisma, sessionId);
  assert.equal(reapprove.ok, false);
  if (reapprove.ok) throw new Error("expected re-approve blocked");
  assert.equal(reapprove.error, "already_approved");

  const afterReapprove = await prisma.movement.count({
    where: { stocktakeSessionId: sessionId },
  });
  assert.equal(afterReapprove, 3, "re-approve must not double-post");

  const editBlocked = await upsertStocktakeLine(prisma, {
    sessionId,
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    countedQty: 99,
  });
  assert.equal(editBlocked.ok, false);
  if (editBlocked.ok) throw new Error("expected edit blocked");
  assert.equal(editBlocked.error, "invalid_status");

  const still = await getStockBalance(prisma, item.item.id, loc.location.id);
  assert.equal(still.toString(), "12.5");

  console.log(
    "prove-stocktake-db: ok (opening movements = counted qty, re-approve/edit blocked, stock sum)",
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
