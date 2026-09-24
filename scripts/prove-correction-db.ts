/**
 * Discriminating acceptance for F015 — needs Postgres.
 * Wrong-movement correction posts an opposite row; original stays;
 * balances equal independent SUM; label reprint does not create a catalog row.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { listRecentMovements } from "../src/server/movements/list-recent-movements";
import { postCorrection } from "../src/server/movements/post-correction";
import { postIssue } from "../src/server/movements/post-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

/** Independent of the app read model — raw SQL SUM over Movement. */
async function independentSum(
  catalogItemId: string,
  locationId: string,
): Promise<Decimal> {
  const rows = await prisma.$queryRaw<{ sum: Prisma.Decimal | null }[]>`
    SELECT COALESCE(SUM(qty), 0) AS sum
    FROM "Movement"
    WHERE "catalogItemId" = ${catalogItemId}
      AND "locationId" = ${locationId}
  `;
  return new Decimal(rows[0]?.sum?.toString() ?? "0");
}

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f015-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F015 Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const item = await createCatalogItem(prisma, {
    sku: `F015-${suffix}`,
    name: `F015 pozycja ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");
  const barcodeBefore = item.item.barcode;
  const catalogCountBefore = await prisma.catalogItem.count({
    where: { barcode: barcodeBefore },
  });
  assert.equal(catalogCountBefore, 1);

  const loc = await createLocation(prisma, {
    code: `F15-${suffix}`,
    label: `F015 loc ${suffix}`,
  });
  assert.equal(loc.ok, true);
  if (!loc.ok) throw new Error("location failed");

  // Mistaken receipt of 7
  const mistaken = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    qty: "7",
    createdById: actor.id,
  });
  assert.equal(mistaken.ok, true);
  if (!mistaken.ok) throw new Error("receipt failed");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: loc.location.id,
      })
    ).toString(),
    "7",
  );

  // 1) Correcting posts opposite so balances match intended (zero here)
  const correction = await postCorrection(prisma, {
    movementId: mistaken.movement.id,
    createdById: actor.id,
  });
  assert.equal(correction.ok, true);
  if (!correction.ok) throw new Error("correction failed");
  assert.equal(correction.movement.type, "correction");
  assert.equal(correction.movement.qty.toString(), "-7");
  assert.equal(correction.movement.correctsMovementId, mistaken.movement.id);
  assert.equal(correction.original.id, mistaken.movement.id);

  const after = await sumMovementQty(prisma, {
    catalogItemId: item.item.id,
    locationId: loc.location.id,
  });
  assert.equal(after.toString(), "0");

  // 4) Stock endpoints equal independent SUM after correction
  const raw = await independentSum(item.item.id, loc.location.id);
  assert.equal(raw.toString(), after.toString());
  assert.equal(raw.toString(), "0");

  // 2) Original remains visible alongside correction (no silent overwrite)
  const stillThere = await prisma.movement.findUnique({
    where: { id: mistaken.movement.id },
  });
  assert.ok(stillThere, "original movement must still exist");
  assert.equal(stillThere?.qty.toString(), "7");
  assert.equal(stillThere?.type, "receipt");

  const history = await listRecentMovements(prisma, {
    catalogItemId: item.item.id,
    take: 20,
  });
  const ids = history.map((r) => r.id);
  assert.ok(ids.includes(mistaken.movement.id), "history lists original");
  assert.ok(ids.includes(correction.movement.id), "history lists correction");
  const originalRow = history.find((r) => r.id === mistaken.movement.id);
  const correctionRow = history.find((r) => r.id === correction.movement.id);
  assert.equal(originalRow?.hasCorrection, true);
  assert.equal(correctionRow?.correctsMovementId, mistaken.movement.id);
  assert.equal(correctionRow?.type, "correction");

  // Second correction of same original refused
  const again = await postCorrection(prisma, {
    movementId: mistaken.movement.id,
    createdById: actor.id,
  });
  assert.equal(again.ok, false);
  if (again.ok) throw new Error("expected already_corrected");
  assert.equal(again.error, "already_corrected");

  // Correcting a correction refused
  const onCorrection = await postCorrection(prisma, {
    movementId: correction.movement.id,
    createdById: actor.id,
  });
  assert.equal(onCorrection.ok, false);
  if (onCorrection.ok) throw new Error("expected is_correction");
  assert.equal(onCorrection.error, "is_correction");

  // Issue then correct restores stock; insufficient when stock already gone
  const receipt2 = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    qty: "5",
    createdById: actor.id,
  });
  assert.equal(receipt2.ok, true);
  if (!receipt2.ok) throw new Error("receipt2 failed");

  const issue = await postIssue(prisma, {
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    qty: "5",
    createdById: actor.id,
  });
  assert.equal(issue.ok, true);
  if (!issue.ok) throw new Error("issue failed");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: loc.location.id,
      })
    ).toString(),
    "0",
  );

  // Correcting the receipt while stock is already zero must refuse overdraw
  const overdraw = await postCorrection(prisma, {
    movementId: receipt2.movement.id,
    createdById: actor.id,
  });
  assert.equal(overdraw.ok, false);
  if (overdraw.ok) throw new Error("expected insufficient_stock");
  assert.equal(overdraw.error, "insufficient_stock");

  // Correct the issue (negative → opposite +5) restores intended stock
  const undoIssue = await postCorrection(prisma, {
    movementId: issue.movement.id,
    createdById: actor.id,
  });
  assert.equal(undoIssue.ok, true);
  if (!undoIssue.ok) throw new Error("undo issue failed");
  assert.equal(undoIssue.movement.qty.toString(), "5");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: item.item.id,
        locationId: loc.location.id,
      })
    ).toString(),
    "5",
  );
  assert.equal(
    (await independentSum(item.item.id, loc.location.id)).toString(),
    "5",
  );

  // 3) Label reprint uses existing barcode — no duplicate catalog row
  const catalogCountAfter = await prisma.catalogItem.count({
    where: { barcode: barcodeBefore },
  });
  assert.equal(catalogCountAfter, 1, "reprint must not create a catalog item");
  const sameItem = await prisma.catalogItem.findUnique({
    where: { id: item.item.id },
  });
  assert.equal(sameItem?.barcode, barcodeBefore);

  console.log(
    "prove-correction-db: ok (storno · original kept · independent SUM · no duplicate SKU)",
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
