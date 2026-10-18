/**
 * Discriminating acceptance for F016 — needs Postgres.
 * Good return ↑ shelf; renovation return parks at renovation location
 * (visible in where-is); batch vendor issue ↓ renovation stock with actor.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { postGoodReturn } from "../src/server/movements/post-good-return";
import { postRenovationReturn } from "../src/server/movements/post-renovation-return";
import { postVendorIssueBatch } from "../src/server/movements/post-vendor-issue-batch";
import { listItemLocations } from "../src/server/stock/list-item-locations";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f016-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F016 Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const item = await createCatalogItem(prisma, {
    name: `F016 pozycja ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");

  const shelf = await createLocation(prisma, {
    code: `F16S-${suffix}`,
    label: `F016 shelf ${suffix}`,
  });
  assert.equal(shelf.ok, true);
  if (!shelf.ok) throw new Error("shelf location failed");

  const reno = await createLocation(prisma, {
    code: `F16R-${suffix}`,
    label: `F016 renowacja ${suffix}`,
    isRenovation: true,
  });
  assert.equal(reno.ok, true);
  if (!reno.ok) throw new Error("renovation location failed");
  assert.equal(reno.location.isRenovation, true);

  // 1) Good return increases chosen shelf by returned qty via movements
  const good = await postGoodReturn(prisma, {
    catalogItemId: item.item.id,
    locationId: shelf.location.id,
    qty: "5",
    createdById: actor.id,
  });
  assert.equal(good.ok, true);
  if (!good.ok) throw new Error("good return failed");
  assert.equal(good.movement.type, "receipt");
  assert.equal(good.movement.qty.toString(), "5");
  assert.equal(good.movement.createdById, actor.id);
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "5",
  );

  // Good return refuses renovation destination
  const goodOntoReno = await postGoodReturn(prisma, {
    catalogItemId: item.item.id,
    locationId: reno.location.id,
    qty: "1",
    createdById: actor.id,
  });
  assert.equal(goodOntoReno.ok, false);
  if (goodOntoReno.ok) throw new Error("expected not_shelf");
  assert.equal(goodOntoReno.error, "not_shelf");

  // 2) Renovation return places stock at renovation section (where-is / balances)
  const toReno = await postRenovationReturn(prisma, {
    catalogItemId: item.item.id,
    locationId: reno.location.id,
    qty: "3",
    createdById: actor.id,
  });
  assert.equal(toReno.ok, true);
  if (!toReno.ok) throw new Error("renovation return failed");
  assert.equal(toReno.movement.type, "receipt");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: reno.location.id,
      })
    ).toString(),
    "3",
  );

  const locate = await listItemLocations(prisma, item.item.id);
  assert.equal(locate.ok, true);
  if (!locate.ok) throw new Error("locate failed");
  const renoRow = locate.locations.find(
    (l) => l.locationId === reno.location.id,
  );
  assert.ok(renoRow, "renovation location must appear in where-is");
  assert.equal(renoRow.qty, "3");
  const shelfRow = locate.locations.find(
    (l) => l.locationId === shelf.location.id,
  );
  assert.ok(shelfRow);
  assert.equal(shelfRow.qty, "5");

  // Renovation return refuses ordinary shelf
  const renoOntoShelf = await postRenovationReturn(prisma, {
    catalogItemId: item.item.id,
    locationId: shelf.location.id,
    qty: "1",
    createdById: actor.id,
  });
  assert.equal(renoOntoShelf.ok, false);
  if (renoOntoShelf.ok) throw new Error("expected not_renovation");
  assert.equal(renoOntoShelf.error, "not_renovation");

  // 3) Batch vendor issue decreases renovation stock; records actor + time
  const beforeIssueAt = new Date();
  const batch = await postVendorIssueBatch(prisma, {
    lines: [
      {
        catalogItemId: item.item.id,
        locationId: reno.location.id,
        qty: "2",
      },
    ],
    createdById: actor.id,
  });
  assert.equal(batch.ok, true);
  if (!batch.ok) throw new Error("vendor issue failed");
  assert.equal(batch.movements.length, 1);
  assert.equal(batch.movements[0]?.type, "issue");
  assert.equal(batch.movements[0]?.qty.toString(), "-2");
  assert.equal(batch.movements[0]?.createdById, actor.id);
  assert.ok(
    batch.movements[0]!.createdAt.getTime() >= beforeIssueAt.getTime() - 1000,
    "issue movement must record createdAt",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: reno.location.id,
      })
    ).toString(),
    "1",
  );
  // Shelf unchanged by vendor issue
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "5",
  );

  // Refuse overdraw from renovation
  const overdraw = await postVendorIssueBatch(prisma, {
    lines: [
      {
        catalogItemId: item.item.id,
        locationId: reno.location.id,
        qty: "9",
      },
    ],
    createdById: actor.id,
  });
  assert.equal(overdraw.ok, false);
  if (overdraw.ok) throw new Error("expected insufficient_stock");
  assert.equal(overdraw.error, "insufficient_stock");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: reno.location.id,
      })
    ).toString(),
    "1",
    "refused vendor issue must not change renovation balance",
  );

  // Refuse vendor issue from non-renovation location
  const fromShelf = await postVendorIssueBatch(prisma, {
    lines: [
      {
        catalogItemId: item.item.id,
        locationId: shelf.location.id,
        qty: "1",
      },
    ],
    createdById: actor.id,
  });
  assert.equal(fromShelf.ok, false);
  if (fromShelf.ok) throw new Error("expected not_renovation");
  assert.equal(fromShelf.error, "not_renovation");

  console.log(
    "prove-returns-renovation-db: ok (good return · reno park · vendor batch · actor)",
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
