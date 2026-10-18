/**
 * Discriminating acceptance for F006 — needs Postgres.
 * After opening + a known additional movement set, displayed qty matches an
 * independent SQL SUM. Schema has no writable raw on-hand qty column.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { approveStocktakeSession } from "../src/server/stocktake/approve-stocktake-session";
import { createStocktakeSession } from "../src/server/stocktake/create-stocktake-session";
import { startStocktakeCounting } from "../src/server/stocktake/start-stocktake-counting";
import { upsertStocktakeLine } from "../src/server/stocktake/upsert-stocktake-line";
import {
  getItemStockTotal,
  getStockBalance,
  listStockBalances,
} from "../src/server/stock/list-stock-balances";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

/** Independent of the app read model — raw SQL SUM over Movement. */
async function independentSum(
  catalogItemId: string,
  locationId?: string,
): Promise<Decimal> {
  if (locationId) {
    const rows = await prisma.$queryRaw<{ sum: Prisma.Decimal | null }[]>`
      SELECT COALESCE(SUM(qty), 0) AS sum
      FROM "Movement"
      WHERE "catalogItemId" = ${catalogItemId}
        AND "locationId" = ${locationId}
    `;
    return new Decimal(rows[0]?.sum?.toString() ?? "0");
  }
  const rows = await prisma.$queryRaw<{ sum: Prisma.Decimal | null }[]>`
    SELECT COALESCE(SUM(qty), 0) AS sum
    FROM "Movement"
    WHERE "catalogItemId" = ${catalogItemId}
  `;
  return new Decimal(rows[0]?.sum?.toString() ?? "0");
}

function assertNoWritableStockColumn() {
  const schema = readFileSync(
    join(process.cwd(), "prisma/schema.prisma"),
    "utf8",
  );
  assert.equal(
    /model\s+ItemLocation\b/.test(schema),
    false,
    "ItemLocation must not exist — stock is movement-derived only",
  );
  const locationBody = schema.match(/model\s+Location\s*\{([^}]+)\}/);
  assert.ok(locationBody, "Location model present");
  assert.equal(
    /\bqty\b/.test(locationBody[1]),
    false,
    "Location must not carry a writable qty",
  );
  const catalogBody = schema.match(/model\s+CatalogItem\s*\{([^}]+)\}/);
  assert.ok(catalogBody, "CatalogItem model present");
  assert.equal(
    /\bqty\b/.test(catalogBody[1]),
    false,
    "CatalogItem must not carry a writable qty",
  );

  const stanyUi = readFileSync(
    join(process.cwd(), "src/components/stock-balance-list.tsx"),
    "utf8",
  );
  assert.equal(
    /<input\b/.test(stanyUi),
    false,
    "/stany UI must not offer a raw on-hand qty input",
  );
  assert.match(
    stanyUi,
    /suma ruchów|Bez ręcznej edycji/i,
    "stock list should state qty is movement-derived",
  );
}

async function main() {
  assertNoWritableStockColumn();

  const suffix = Date.now().toString(36);

  const item = await createCatalogItem(prisma, {
    name: `F006 pozycja ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");

  const locA = await createLocation(prisma, {
    code: `F6A-${suffix}`,
    label: `F006 A ${suffix}`,
  });
  assert.equal(locA.ok, true);
  if (!locA.ok) throw new Error("location A failed");

  const locB = await createLocation(prisma, {
    code: `F6B-${suffix}`,
    label: `F006 B ${suffix}`,
  });
  assert.equal(locB.ok, true);
  if (!locB.ok) throw new Error("location B failed");

  const created = await createStocktakeSession(prisma, {
    note: `F006 prove ${suffix}`,
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("session create failed");
  const sessionId = created.session.id;

  assert.equal(
    (await startStocktakeCounting(prisma, sessionId)).ok,
    true,
  );

  const line = await upsertStocktakeLine(prisma, {
    sessionId,
    catalogItemId: item.item.id,
    locationId: locA.location.id,
    countedQty: 10,
  });
  assert.equal(line.ok, true);

  const approved = await approveStocktakeSession(prisma, sessionId);
  assert.equal(approved.ok, true);
  if (!approved.ok) throw new Error("approve failed");

  // Known additional set (no F007 UI — seed movements directly).
  await prisma.movement.createMany({
    data: [
      {
        type: "receipt",
        catalogItemId: item.item.id,
        locationId: locA.location.id,
        qty: new Decimal("5"),
      },
      {
        type: "issue",
        catalogItemId: item.item.id,
        locationId: locA.location.id,
        qty: new Decimal("-3"),
      },
      {
        type: "transfer",
        catalogItemId: item.item.id,
        locationId: locA.location.id,
        qty: new Decimal("-2"),
      },
      {
        type: "transfer",
        catalogItemId: item.item.id,
        locationId: locB.location.id,
        qty: new Decimal("2"),
      },
    ],
  });

  // Expected: locA 10+5-3-2 = 10; locB = 2; item total = 12
  const expectedA = new Decimal("10");
  const expectedB = new Decimal("2");
  const expectedTotal = new Decimal("12");

  const independentA = await independentSum(item.item.id, locA.location.id);
  const readA = await getStockBalance(
    prisma,
    item.item.id,
    locA.location.id,
  );
  const viaSumA = await sumMovementQty(prisma, {
    catalogItemId: item.item.id,
    locationId: locA.location.id,
  });
  assert.equal(independentA.toString(), expectedA.toString());
  assert.equal(readA.toString(), independentA.toString());
  assert.equal(viaSumA.toString(), independentA.toString());

  const independentB = await independentSum(item.item.id, locB.location.id);
  const readB = await getStockBalance(
    prisma,
    item.item.id,
    locB.location.id,
  );
  assert.equal(independentB.toString(), expectedB.toString());
  assert.equal(readB.toString(), independentB.toString());

  const independentTotal = await independentSum(item.item.id);
  const itemTotal = await getItemStockTotal(prisma, item.item.id);
  assert.equal(independentTotal.toString(), expectedTotal.toString());
  assert.equal(itemTotal.toString(), independentTotal.toString());

  const balances = await listStockBalances(prisma);
  const rowA = balances.find(
    (b) =>
      b.catalogItemId === item.item.id && b.locationId === locA.location.id,
  );
  const rowB = balances.find(
    (b) =>
      b.catalogItemId === item.item.id && b.locationId === locB.location.id,
  );
  assert.ok(rowA, "listStockBalances must include loc A");
  assert.ok(rowB, "listStockBalances must include loc B");
  assert.equal(rowA?.qty, expectedA.toString());
  assert.equal(rowB?.qty, expectedB.toString());

  console.log(
    "prove-stock-from-movements-db: ok (opening+receipt/issue/transfer = independent SUM; no raw qty column/UI)",
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
