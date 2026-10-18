/**
 * F019 — opening stocktake approve is atomic and cannot double stock.
 * Needs Postgres.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { approveStocktakeSession } from "../src/server/stocktake/approve-stocktake-session";
import { createStocktakeSession } from "../src/server/stocktake/create-stocktake-session";
import { startStocktakeCounting } from "../src/server/stocktake/start-stocktake-counting";
import { upsertStocktakeLine } from "../src/server/stocktake/upsert-stocktake-line";
import { getStockBalance } from "../src/server/stock/list-stock-balances";

async function main() {
  const suffix = Date.now().toString(36);

  const item = await createCatalogItem(prisma, {
    sku: `F019-O-${suffix}`,
    name: `F019 opening ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog failed");

  const loc = await createLocation(prisma, {
    code: `F019O-${suffix}`,
    label: `F019 opening ${suffix}`,
  });
  assert.equal(loc.ok, true);
  if (!loc.ok) throw new Error("location failed");

  const created = await createStocktakeSession(prisma, {
    kind: "opening",
    note: `F019 opening once ${suffix}`,
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("session failed");
  const sessionId = created.session.id;

  assert.equal((await startStocktakeCounting(prisma, sessionId)).ok, true);
  assert.equal(
    (
      await upsertStocktakeLine(prisma, {
        sessionId,
        catalogItemId: item.item.id,
        locationId: loc.location.id,
        countedQty: 8,
      })
    ).ok,
    true,
  );

  // Concurrent approve of the same session — exactly one succeeds.
  // Losers may see already_approved (atomic claim) or opening_already_done
  // (opening row already posted under the stock lock) — both refuse a double.
  const concurrent = await Promise.all([
    approveStocktakeSession(prisma, sessionId),
    approveStocktakeSession(prisma, sessionId),
    approveStocktakeSession(prisma, sessionId),
  ]);
  const ok = concurrent.filter((r) => r.ok);
  const blocked = concurrent.filter(
    (r) =>
      !r.ok &&
      (r.error === "already_approved" || r.error === "opening_already_done"),
  );
  assert.equal(ok.length, 1, `expected 1 approve ok, got ${ok.length}`);
  assert.equal(
    blocked.length,
    2,
    `expected 2 blocked, got ${blocked.length} (${concurrent
      .map((r) => (r.ok ? "ok" : r.error))
      .join(",")})`,
  );

  const openings = await prisma.movement.count({
    where: {
      type: "opening",
      catalogItemId: item.item.id,
      locationId: loc.location.id,
    },
  });
  assert.equal(openings, 1);
  assert.equal(
    (await getStockBalance(prisma, item.item.id, loc.location.id)).toString(),
    "8",
  );

  // Second opening session for the same (item, location) must refuse
  const second = await createStocktakeSession(prisma, {
    kind: "opening",
    note: `F019 opening duplicate ${suffix}`,
  });
  assert.equal(second.ok, true);
  if (!second.ok) throw new Error("second session failed");
  assert.equal(
    (await startStocktakeCounting(prisma, second.session.id)).ok,
    true,
  );
  assert.equal(
    (
      await upsertStocktakeLine(prisma, {
        sessionId: second.session.id,
        catalogItemId: item.item.id,
        locationId: loc.location.id,
        countedQty: 8,
      })
    ).ok,
    true,
  );

  const refused = await approveStocktakeSession(prisma, second.session.id);
  assert.equal(refused.ok, false);
  if (refused.ok) throw new Error("expected opening_already_done");
  assert.equal(refused.error, "opening_already_done");

  assert.equal(
    (
      await prisma.movement.count({
        where: {
          type: "opening",
          catalogItemId: item.item.id,
          locationId: loc.location.id,
        },
      })
    ),
    1,
  );
  assert.equal(
    (await getStockBalance(prisma, item.item.id, loc.location.id)).toString(),
    "8",
    "stock must not be doubled",
  );

  console.log(
    "prove-opening-stocktake-once-db: ok (concurrent approve · second opening blocked · no double)",
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
