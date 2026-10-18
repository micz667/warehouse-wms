/**
 * F019 — concurrent cafe sign / emergency must post issue movements once.
 * Needs Postgres.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { emergencyIssueCafeIssue } from "../src/server/cafe-issues/emergency-issue-cafe-issue";
import { prepareCafeIssue } from "../src/server/cafe-issues/prepare-cafe-issue";
import { signCafeIssue } from "../src/server/cafe-issues/sign-cafe-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

const FAKE_SIGNATURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function seedPreparedDoc(suffix: string, tag: string) {
  const actor = await prisma.user.create({
    data: {
      email: `f019-cafe-${tag}-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F019 Cafe ${tag} ${suffix}`,
      role: "magazynier",
    },
  });

  const item = await createCatalogItem(prisma, {
    name: `F019 cafe ${tag} ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog failed");

  const shelf = await createLocation(prisma, {
    code: `F019C-${tag}-S-${suffix}`,
    label: `F019 cafe shelf ${tag} ${suffix}`,
  });
  assert.equal(shelf.ok, true);
  if (!shelf.ok) throw new Error("shelf failed");

  const cafe = await createLocation(prisma, {
    code: `F019C-${tag}-C-${suffix}`,
    label: `F019 cafe loc ${tag} ${suffix}`,
  });
  assert.equal(cafe.ok, true);
  if (!cafe.ok) throw new Error("cafe failed");

  const receipt = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: shelf.location.id,
    qty: "20",
    createdById: actor.id,
  });
  assert.equal(receipt.ok, true);
  if (!receipt.ok) throw new Error("receipt failed");

  const prepared = await prepareCafeIssue(prisma, {
    cafeLocationId: cafe.location.id,
    note: `prove-double ${tag} ${suffix}`,
    createdById: actor.id,
    lines: [
      {
        catalogItemId: item.item.id,
        sourceLocationId: shelf.location.id,
        qty: "5",
      },
    ],
  });
  assert.equal(prepared.ok, true);
  if (!prepared.ok) throw new Error("prepare failed");

  return {
    actor,
    itemId: item.item.id,
    shelfId: shelf.location.id,
    cafeIssueId: prepared.cafeIssue.id,
  };
}

async function main() {
  const suffix = Date.now().toString(36);

  // 1) Concurrent signCafeIssue — exactly one success, stock −5 once
  const signDoc = await seedPreparedDoc(suffix, "sign");
  const signResults = await Promise.all([
    signCafeIssue(prisma, {
      cafeIssueId: signDoc.cafeIssueId,
      signatureData: FAKE_SIGNATURE,
      signedById: signDoc.actor.id,
    }),
    signCafeIssue(prisma, {
      cafeIssueId: signDoc.cafeIssueId,
      signatureData: FAKE_SIGNATURE,
      signedById: signDoc.actor.id,
    }),
    signCafeIssue(prisma, {
      cafeIssueId: signDoc.cafeIssueId,
      signatureData: FAKE_SIGNATURE,
      signedById: signDoc.actor.id,
    }),
  ]);

  const signOk = signResults.filter((r) => r.ok);
  const signBlocked = signResults.filter(
    (r) => !r.ok && r.error === "invalid_status",
  );
  assert.equal(signOk.length, 1, `expected 1 sign ok, got ${signOk.length}`);
  assert.equal(
    signBlocked.length,
    2,
    `expected 2 invalid_status, got ${signBlocked.length}`,
  );

  const signIssues = await prisma.movement.count({
    where: {
      catalogItemId: signDoc.itemId,
      locationId: signDoc.shelfId,
      type: "issue",
    },
  });
  assert.equal(signIssues, 1);
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: signDoc.itemId,
        locationId: signDoc.shelfId,
      })
    ).toString(),
    "15",
  );

  // 2) Concurrent emergencyIssueCafeIssue — same single-post guarantee
  const emergDoc = await seedPreparedDoc(suffix, "em");
  const emergResults = await Promise.all([
    emergencyIssueCafeIssue(prisma, {
      cafeIssueId: emergDoc.cafeIssueId,
      confirmed: true,
      emergencyNote: "awaria tabletu — concurrent prove A",
      issuedById: emergDoc.actor.id,
    }),
    emergencyIssueCafeIssue(prisma, {
      cafeIssueId: emergDoc.cafeIssueId,
      confirmed: true,
      emergencyNote: "awaria tabletu — concurrent prove B",
      issuedById: emergDoc.actor.id,
    }),
  ]);

  const emergOk = emergResults.filter((r) => r.ok);
  const emergBlocked = emergResults.filter(
    (r) => !r.ok && r.error === "invalid_status",
  );
  assert.equal(emergOk.length, 1);
  assert.equal(emergBlocked.length, 1);

  const emergIssues = await prisma.movement.count({
    where: {
      catalogItemId: emergDoc.itemId,
      locationId: emergDoc.shelfId,
      type: "issue",
    },
  });
  assert.equal(emergIssues, 1);
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: emergDoc.itemId,
        locationId: emergDoc.shelfId,
      })
    ).toString(),
    "15",
  );

  console.log(
    "prove-cafe-double-post-db: ok (concurrent sign · concurrent emergency · one post each)",
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
