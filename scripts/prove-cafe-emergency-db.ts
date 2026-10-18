/**
 * Discriminating acceptance for F018 — needs Postgres.
 * Emergency issue on prepared doc → stock down + signatureSkipped + actor/ts/note;
 * without confirm/note stays prepared; signed F013b path still works.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { emergencyIssueCafeIssue } from "../src/server/cafe-issues/emergency-issue-cafe-issue";
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
      email: `f018-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F018 Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const itemA = await createCatalogItem(prisma, {
    name: `F018 A ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemA.ok, true);
  if (!itemA.ok) throw new Error("catalog A failed");

  const itemB = await createCatalogItem(prisma, {
    name: `F018 B ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemB.ok, true);
  if (!itemB.ok) throw new Error("catalog B failed");

  const shelf = await createLocation(prisma, {
    code: `F018-S-${suffix}`,
    label: `F018 shelf ${suffix}`,
  });
  assert.equal(shelf.ok, true);
  if (!shelf.ok) throw new Error("shelf failed");

  const cafe = await createLocation(prisma, {
    code: `F018-C-${suffix}`,
    label: `F018 cafe ${suffix}`,
  });
  assert.equal(cafe.ok, true);
  if (!cafe.ok) throw new Error("cafe failed");

  const receiptA = await postReceipt(prisma, {
    catalogItemId: itemA.item.id,
    locationId: shelf.location.id,
    qty: "20",
    createdById: actor.id,
  });
  assert.equal(receiptA.ok, true);
  if (!receiptA.ok) throw new Error("receipt A failed");

  const receiptB = await postReceipt(prisma, {
    catalogItemId: itemB.item.id,
    locationId: shelf.location.id,
    qty: "10",
    createdById: actor.id,
  });
  assert.equal(receiptB.ok, true);
  if (!receiptB.ok) throw new Error("receipt B failed");

  const prepared = await prepareCafeIssue(prisma, {
    cafeLocationId: cafe.location.id,
    note: `prove-emergency ${suffix}`,
    createdById: actor.id,
    lines: [
      {
        catalogItemId: itemA.item.id,
        sourceLocationId: shelf.location.id,
        qty: "4",
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

  // 1) Conscious confirm required — missing confirm / note leave prepared + stock
  const noConfirm = await emergencyIssueCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    confirmed: false,
    emergencyNote: "tablet down at cafe",
    issuedById: actor.id,
  });
  assert.equal(noConfirm.ok, false);
  if (noConfirm.ok) throw new Error("expected confirm required");
  assert.equal(noConfirm.error, "validation");

  const noNote = await emergencyIssueCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    confirmed: true,
    emergencyNote: "",
    issuedById: actor.id,
  });
  assert.equal(noNote.ok, false);
  if (noNote.ok) throw new Error("expected note required");
  assert.equal(noNote.error, "validation");

  assert.equal(
    (await getCafeIssue(prisma, prepared.cafeIssue.id))!.status,
    "prepared",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemA.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "20",
  );

  // 2) After confirm: stock down, not left prepared awaiting signature
  const issued = await emergencyIssueCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    confirmed: true,
    emergencyNote: `tablet awaria ${suffix}`,
    issuedById: actor.id,
  });
  assert.equal(issued.ok, true);
  if (!issued.ok) throw new Error("emergency issue failed");
  assert.equal(issued.cafeIssue.status, "received");
  assert.equal(issued.cafeIssue.signatureSkipped, true);
  assert.equal(issued.cafeIssue.emergencyNote, `tablet awaria ${suffix}`);
  assert.equal(issued.cafeIssue.signatureData, null);
  assert.ok(issued.cafeIssue.signedAt);
  assert.equal(issued.cafeIssue.signedById, actor.id);
  assert.equal(issued.movements.length, 2);

  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemA.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "16",
    "item A stock must drop by emergency qty 4",
  );
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemB.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "8",
    "item B stock must drop by emergency qty 2",
  );

  const listedPrepared = await listCafeIssues(prisma, {
    statuses: ["prepared"],
  });
  assert.equal(
    listedPrepared.some((row) => row.id === prepared.cafeIssue.id),
    false,
  );

  // 3) History / document shows bypass with actor, timestamp, reason
  const loaded = await getCafeIssue(prisma, prepared.cafeIssue.id);
  assert.ok(loaded);
  assert.equal(loaded!.status, "received");
  assert.equal(loaded!.signatureSkipped, true);
  assert.equal(loaded!.emergencyNote, `tablet awaria ${suffix}`);
  assert.ok(loaded!.signedAt);
  assert.equal(loaded!.signedById, actor.id);
  assert.equal(loaded!.signedBy?.email, actor.email);
  assert.equal(loaded!.signatureData, null);

  // Re-issue / re-sign blocked on closed emergency doc
  const again = await emergencyIssueCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    confirmed: true,
    emergencyNote: "again",
    issuedById: actor.id,
  });
  assert.equal(again.ok, false);
  if (again.ok) throw new Error("expected re-emergency blocked");
  assert.equal(again.error, "invalid_status");

  const resign = await signCafeIssue(prisma, {
    cafeIssueId: prepared.cafeIssue.id,
    signatureData: FAKE_SIGNATURE,
    signedById: actor.id,
  });
  assert.equal(resign.ok, false);
  if (resign.ok) throw new Error("expected sign on emergency doc blocked");
  assert.equal(resign.error, "invalid_status");

  // 4) Normal signed path (F013a → F013b) still works as default
  const preparedSign = await prepareCafeIssue(prisma, {
    cafeLocationId: cafe.location.id,
    createdById: actor.id,
    lines: [
      {
        catalogItemId: itemA.item.id,
        sourceLocationId: shelf.location.id,
        qty: "3",
      },
    ],
  });
  assert.equal(preparedSign.ok, true);
  if (!preparedSign.ok) throw new Error("prepare for sign failed");

  const signed = await signCafeIssue(prisma, {
    cafeIssueId: preparedSign.cafeIssue.id,
    signatureData: FAKE_SIGNATURE,
    signedById: actor.id,
  });
  assert.equal(signed.ok, true);
  if (!signed.ok) throw new Error("normal sign failed");
  assert.equal(signed.cafeIssue.status, "received");
  assert.equal(signed.cafeIssue.signatureSkipped, false);
  assert.equal(signed.cafeIssue.signatureData, FAKE_SIGNATURE);
  assert.equal(signed.cafeIssue.emergencyNote, null);
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: itemA.item.id,
        locationId: shelf.location.id,
      })
    ).toString(),
    "13",
    "signed path must still drop stock",
  );

  console.log(
    "prove-cafe-emergency-db: ok (confirm+note · stock down · bypass logged · signed path intact)",
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
