/**
 * Discriminating acceptance for F012 — needs Postgres.
 * Przenieś: source −qty / dest +qty in one transaction; transfer refuses
 * negative source; where-is lists positive locations only (zeros omitted).
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { postIssue } from "../src/server/movements/post-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { postTransfer } from "../src/server/movements/post-transfer";
import { listItemLocations } from "../src/server/stock/list-item-locations";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f012-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F012 Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const item = await createCatalogItem(prisma, {
    sku: `F012-${suffix}`,
    name: `F012 pozycja ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");

  const locA = await createLocation(prisma, {
    code: `F12A-${suffix}`,
    label: `F012 A ${suffix}`,
  });
  assert.equal(locA.ok, true);
  if (!locA.ok) throw new Error("location A failed");

  const locB = await createLocation(prisma, {
    code: `F12B-${suffix}`,
    label: `F012 B ${suffix}`,
  });
  assert.equal(locB.ok, true);
  if (!locB.ok) throw new Error("location B failed");

  const locC = await createLocation(prisma, {
    code: `F12C-${suffix}`,
    label: `F012 C empty ${suffix}`,
  });
  assert.equal(locC.ok, true);
  if (!locC.ok) throw new Error("location C failed");

  // Seed: 10 on A
  const receipt = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: locA.location.id,
    qty: "10",
    createdById: actor.id,
  });
  assert.equal(receipt.ok, true);
  if (!receipt.ok) throw new Error("receipt failed");

  // 1) Completing Przenieś decreases source and increases destination by same qty
  const transfer = await postTransfer(prisma, {
    catalogItemId: item.item.id,
    fromLocationId: locA.location.id,
    toLocationId: locB.location.id,
    qty: "4",
    createdById: actor.id,
  });
  assert.equal(transfer.ok, true);
  if (!transfer.ok) throw new Error("transfer failed");
  assert.equal(transfer.from.type, "transfer");
  assert.equal(transfer.to.type, "transfer");
  assert.equal(transfer.from.qty.toString(), "-4");
  assert.equal(transfer.to.qty.toString(), "4");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locA.location.id,
      })
    ).toString(),
    "6",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locB.location.id,
      })
    ).toString(),
    "4",
  );

  // 2) Transfer from a location refuses when available balance would go negative
  const overdraw = await postTransfer(prisma, {
    catalogItemId: item.item.id,
    fromLocationId: locA.location.id,
    toLocationId: locB.location.id,
    qty: "7",
    createdById: actor.id,
  });
  assert.equal(overdraw.ok, false);
  if (overdraw.ok) throw new Error("expected insufficient_stock");
  assert.equal(overdraw.error, "insufficient_stock");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locA.location.id,
      })
    ).toString(),
    "6",
    "refused transfer must not change source balance",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locB.location.id,
      })
    ).toString(),
    "4",
    "refused transfer must not change destination balance",
  );

  // 3–4) Where-is: each positive location + qty; zero-balance omitted
  // Drain A to zero via issue so A had movements but balance 0.
  const drain = await postIssue(prisma, {
    catalogItemId: item.item.id,
    locationId: locA.location.id,
    qty: "6",
    createdById: actor.id,
  });
  assert.equal(drain.ok, true);
  if (!drain.ok) throw new Error("drain issue failed");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: locA.location.id,
      })
    ).toString(),
    "0",
  );

  const locate = await listItemLocations(prisma, item.item.id);
  assert.equal(locate.ok, true);
  if (!locate.ok) throw new Error("locate failed");
  assert.equal(locate.item.id, item.item.id);
  assert.equal(locate.locations.length, 1, "only loc B holds stock");
  assert.equal(locate.locations[0]?.locationId, locB.location.id);
  assert.equal(locate.locations[0]?.qty, "4");
  assert.equal(locate.total, "4");
  assert.ok(
    !locate.locations.some((l) => l.locationId === locA.location.id),
    "zero-balance A must not be listed as holding stock",
  );
  assert.ok(
    !locate.locations.some((l) => l.locationId === locC.location.id),
    "never-touched C must not appear",
  );
  assert.ok(
    locate.locations.every((l) => Number(l.qty) > 0),
    "every listed location must have positive qty",
  );

  // Empty item still returns ok with empty locations
  const emptyItem = await createCatalogItem(prisma, {
    sku: `F012E-${suffix}`,
    name: `F012 empty ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(emptyItem.ok, true);
  if (!emptyItem.ok) throw new Error("empty catalog create failed");
  const emptyLocate = await listItemLocations(prisma, emptyItem.item.id);
  assert.equal(emptyLocate.ok, true);
  if (!emptyLocate.ok) throw new Error("empty locate failed");
  assert.deepEqual(emptyLocate.locations, []);
  assert.equal(emptyLocate.total, "0");

  console.log(
    "prove-transfer-locate-db: ok (paired transfer · refuse negative · locate positive only)",
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
