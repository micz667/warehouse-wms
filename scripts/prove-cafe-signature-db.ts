/**
 * Discriminating acceptance for F013b — needs Postgres.
 * Sign prepared doc → issue movements + stock down; without sign stock stays;
 * signed actor+timestamp persisted; re-sign / non-prepared blocked.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { getCafeIssue } from "../src/server/cafe-issues/get-cafe-issue";
import { listCafeIssues } from "../src/server/cafe-issues/list-cafe-issues";
import { prepareCafeIssue } from "../src/server/cafe-issues/prepare-cafe-issue";
import { signCafeIssue } from "../src/server/cafe-issues/sign-cafe-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

/** Minimal valid PNG data URL (1×1) — long enough for server min length. */
const FAKE_SIGNATURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f013b-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F013b Signer ${suffix}`,
      role: "magazynier",
    },
  });

  const itemA = await createCatalogItem(prisma, {
    name: `F013b A ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemA.ok, true);
  if (!itemA.ok) throw new Error("catalog A failed");

  const itemB = await createCatalogItem(prisma, {
    name: `F013b B ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemB.ok, true);
  if (!itemB.ok) throw new Error("catalog B failed");

  const shelf = await createLocation(prisma, {
    code: `F13BS-S-${suffix}`,
    label: `F013b shelf ${suffix}`,
  });
  assert.equal(shelf.ok, true);
  if (!shelf.ok) throw new Error("shelf failed");

  const cafe = await createLocation(prisma, {
    code: `F13BS-C-${suffix}`,
    label: `F013b cafe ${suffix}`,
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

  const prepared = await prepareCafeIssue(prisma, {
    cafeLocationId: cafe.location.id,
    note: `prove-sign ${suffix}`,
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

  // 2) Without signature: stays prepared, stock still at warehouse
  assert.equal(prepared.cafeIssue.status, "prepared");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemA.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "10",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemB.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "5",
  );
  const issueCountBefore = await prisma.movement.count({
    where: {
      catalogItemId: { in: [itemA.item.id, itemB.item.id] },
      type: "issue",
    },
  });
  assert.equal(issueCountBefore, 0);

  const blank = await signCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    signatureData: "",
    signedById: actor.id,
  });
  assert.equal(blank.ok, false);
  if (blank.ok) throw new Error("expected blank signature blocked");
  assert.equal(blank.error, "validation");

  // Still prepared after failed sign
  const stillPrepared = await getCafeIssue(prisma, prepared.cafeIssue.id);
  assert.ok(stillPrepared);
  assert.equal(stillPrepared!.status, "prepared");
  assert.equal(stillPrepared!.signedAt, null);

  // 1) Signing posts issue movements and decreases warehouse stock
  const signed = await signCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    signatureData: FAKE_SIGNATURE,
    signedById: actor.id,
  });
  assert.equal(signed.ok, true);
  if (!signed.ok) throw new Error("sign failed");
  assert.equal(signed.cafeIssue.status, "received");
  assert.equal(signed.movements.length, 2);
  assert.ok(signed.cafeIssue.signedAt);
  assert.equal(signed.cafeIssue.signedById, actor.id);
  assert.equal(signed.cafeIssue.signatureData, FAKE_SIGNATURE);

  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemA.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "7",
    "item A stock must drop by signed qty 3",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemB.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "3",
    "item B stock must drop by signed qty 2",
  );

  const issueCountAfter = await prisma.movement.count({
    where: {
      catalogItemId: { in: [itemA.item.id, itemB.item.id] },
      type: "issue",
    },
  });
  assert.equal(issueCountAfter, 2);

  // 3) Signature actor and timestamp visible on loaded document
  const loaded = await getCafeIssue(prisma, prepared.cafeIssue.id);
  assert.ok(loaded);
  assert.equal(loaded!.status, "received");
  assert.ok(loaded!.signedAt);
  assert.equal(loaded!.signedById, actor.id);
  assert.equal(loaded!.signedBy?.email, actor.email);
  assert.equal(loaded!.signedBy?.name, actor.name);
  assert.ok(loaded!.signatureData?.startsWith("data:image/png"));

  // Leaves prepared list
  const listed = await listCafeIssues(prisma, { statuses: ["prepared"] });
  assert.equal(
    listed.some((row) => row.id === prepared.cafeIssue.id),
    false,
  );
  const receivedList = await listCafeIssues(prisma, {
    statuses: ["received"],
  });
  assert.ok(receivedList.some((row) => row.id === prepared.cafeIssue.id));

  // 4) Signing applies only to prepared docs — re-sign blocked
  const resign = await signCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    signatureData: FAKE_SIGNATURE,
    signedById: actor.id,
  });
  assert.equal(resign.ok, false);
  if (resign.ok) throw new Error("expected re-sign blocked");
  assert.equal(resign.error, "invalid_status");

  const missing = await signCafeIssue(prisma, {
    cafeIssueId: "does-not-exist",
    signatureData: FAKE_SIGNATURE,
    signedById: actor.id,
  });
  assert.equal(missing.ok, false);
  if (missing.ok) throw new Error("expected missing blocked");
  assert.equal(missing.error, "not_found");

  // Insufficient stock refused (prepare another doc that would overdraw)
  const overdrawPrep = await prepareCafeIssue(prisma, {
    cafeLocationId: cafe.location.id,
    createdById: actor.id,
    lines: [
      {
        catalogItemId: itemA.item.id,
        sourceLocationId: shelf.location.id,
        qty: "100",
      },
    ],
  });
  assert.equal(overdrawPrep.ok, true);
  if (!overdrawPrep.ok) throw new Error("overdraw prepare failed");
  const overdraw = await signCafeIssue(prisma, {
    cafeIssueId: overdrawPrep.cafeIssue.id,
    signatureData: FAKE_SIGNATURE,
    signedById: actor.id,
  });
  assert.equal(overdraw.ok, false);
  if (overdraw.ok) throw new Error("expected insufficient stock");
  assert.equal(overdraw.error, "insufficient_stock");
  const overdrawDoc = await getCafeIssue(prisma, overdrawPrep.cafeIssue.id);
  assert.equal(overdrawDoc!.status, "prepared");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemA.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "7",
    "failed sign must not change stock",
  );

  console.log(
    "prove-cafe-signature-db: ok (sign posts issue · stock down · no-sign stays · actor/ts · prepared-only)",
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
