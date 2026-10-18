/**
 * Discriminating acceptance for F013a — needs Postgres.
 * Prepare creates prepared/in-transit doc with lines + cafe; warehouse
 * movement sums unchanged; docs listable/openable; prepare path posts no issue.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { getCafeIssue } from "../src/server/cafe-issues/get-cafe-issue";
import { listCafeIssues } from "../src/server/cafe-issues/list-cafe-issues";
import { prepareCafeIssue } from "../src/server/cafe-issues/prepare-cafe-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f013a-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F013a Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const itemA = await createCatalogItem(prisma, {
    name: `F013a A ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemA.ok, true);
  if (!itemA.ok) throw new Error("catalog A failed");

  const itemB = await createCatalogItem(prisma, {
    name: `F013a B ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemB.ok, true);
  if (!itemB.ok) throw new Error("catalog B failed");

  const shelf = await createLocation(prisma, {
    code: `F13S-${suffix}`,
    label: `F013a shelf ${suffix}`,
  });
  assert.equal(shelf.ok, true);
  if (!shelf.ok) throw new Error("shelf failed");

  const cafe = await createLocation(prisma, {
    code: `F13C-${suffix}`,
    label: `F013a cafe ${suffix}`,
  });
  assert.equal(cafe.ok, true);
  if (!cafe.ok) throw new Error("cafe failed");

  const receiptA = await postReceipt(prisma, {
    catalogItemId: itemA.item.id,
    locationId: shelf.location.id,
    qty: "10",
    createdById: actor.id,
  });
  assert.equal(receiptA.ok, true);
  if (!receiptA.ok) throw new Error("receipt A failed");

  const receiptB = await postReceipt(prisma, {
    catalogItemId: itemB.item.id,
    locationId: shelf.location.id,
    qty: "5",
    createdById: actor.id,
  });
  assert.equal(receiptB.ok, true);
  if (!receiptB.ok) throw new Error("receipt B failed");

  const balABefore = await sumMovementQty(prisma, {
    catalogItemId: itemA.item.id,
    locationId: shelf.location.id,
  });
  const balBBefore = await sumMovementQty(prisma, {
    catalogItemId: itemB.item.id,
    locationId: shelf.location.id,
  });
  assert.equal(balABefore.toString(), "10");
  assert.equal(balBBefore.toString(), "5");

  const movementsBefore = await prisma.movement.count({
    where: {
      catalogItemId: { in: [itemA.item.id, itemB.item.id] },
      type: "issue",
    },
  });

  // 1) Completing prepare creates prepared doc with lines + cafe destination
  const prepared = await prepareCafeIssue(prisma, {
    cafeLocationId: cafe.location.id,
    note: `prove ${suffix}`,
    createdById: actor.id,
    lines: [
      {
        catalogItemId: itemA.item.id,
        sourceLocationId: shelf.location.id,
        qty: "3",
      },
      {
        catalogItemId: itemB.item.id,
        sourceLocationId: shelf.location.id,
        qty: "2",
      },
    ],
  });
  assert.equal(prepared.ok, true);
  if (!prepared.ok) throw new Error("prepare failed");
  assert.equal(prepared.cafeIssue.status, "prepared");
  assert.equal(prepared.cafeIssue.cafeLocationId, cafe.location.id);

  const loaded = await getCafeIssue(prisma, prepared.cafeIssue.id);
  assert.ok(loaded);
  assert.equal(loaded!.status, "prepared");
  assert.equal(loaded!.cafeLocation.code, cafe.location.code);
  assert.equal(loaded!.lines.length, 2);
  const lineA = loaded!.lines.find(
    (l) => l.catalogItemId === itemA.item.id,
  );
  const lineB = loaded!.lines.find(
    (l) => l.catalogItemId === itemB.item.id,
  );
  assert.ok(lineA);
  assert.ok(lineB);
  assert.equal(lineA!.qty.toString(), "3");
  assert.equal(lineB!.qty.toString(), "2");
  assert.equal(lineA!.sourceLocationId, shelf.location.id);

  // 2) After prepare, warehouse stock balances unchanged
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemA.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    balABefore.toString(),
    "prepare must not change item A balance",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemB.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    balBBefore.toString(),
    "prepare must not change item B balance",
  );

  // 4) This path alone cannot post stock-leaving issue movements
  const movementsAfter = await prisma.movement.count({
    where: {
      catalogItemId: { in: [itemA.item.id, itemB.item.id] },
      type: "issue",
    },
  });
  assert.equal(
    movementsAfter,
    movementsBefore,
    "prepare must not create issue Movement rows",
  );

  // 3) Prepared documents are listable and openable
  const listed = await listCafeIssues(prisma, { statuses: ["prepared"] });
  const hit = listed.find((row) => row.id === prepared.cafeIssue.id);
  assert.ok(hit, "prepared doc must appear in list");
  assert.equal(hit!._count.lines, 2);
  assert.equal(hit!.cafeLocationId, cafe.location.id);

  const empty = await prepareCafeIssue(prisma, {
    cafeLocationId: cafe.location.id,
    lines: [],
  });
  assert.equal(empty.ok, false);
  if (empty.ok) throw new Error("expected empty prepare blocked");
  assert.equal(empty.error, "empty");

  console.log(
    "prove-cafe-prepare-db: ok (prepared doc · stock unchanged · list/open · no issue movements)",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
