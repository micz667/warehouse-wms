/**
 * Discriminating acceptance for F014 — needs Postgres.
 * Product-centric listRecentMovements shows opening/receipt/transfer/issue
 * for one SKU, newest-first, with type/qty/location/actor/time.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { listRecentMovements } from "../src/server/movements/list-recent-movements";
import { postIssue } from "../src/server/movements/post-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { postTransfer } from "../src/server/movements/post-transfer";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f014-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F014 Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const item = await createCatalogItem(prisma, {
    name: `F014 pozycja ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog create failed");

  const noise = await createCatalogItem(prisma, {
    name: `F014 noise ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(noise.ok, true);
  if (!noise.ok) throw new Error("noise catalog create failed");

  const locA = await createLocation(prisma, {
    code: `F14A-${suffix}`,
    label: `F014 A ${suffix}`,
  });
  assert.equal(locA.ok, true);
  if (!locA.ok) throw new Error("location A failed");

  const locB = await createLocation(prisma, {
    code: `F14B-${suffix}`,
    label: `F014 B ${suffix}`,
  });
  assert.equal(locB.ok, true);
  if (!locB.ok) throw new Error("location B failed");

  // Opening (F005-style) then receipt / transfer / issue for the target SKU.
  const opening = await prisma.movement.create({
    data: {
      type: "opening",
      catalogItemId: item.item.id,
      locationId: locA.location.id,
      qty: "8",
      createdById: actor.id,
    },
  });

  const receipt = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: locA.location.id,
    qty: "5",
    createdById: actor.id,
  });
  assert.equal(receipt.ok, true);
  if (!receipt.ok) throw new Error("receipt failed");

  const transfer = await postTransfer(prisma, {
    catalogItemId: item.item.id,
    fromLocationId: locA.location.id,
    toLocationId: locB.location.id,
    qty: "3",
    createdById: actor.id,
  });
  assert.equal(transfer.ok, true);
  if (!transfer.ok) throw new Error("transfer failed");

  const issue = await postIssue(prisma, {
    catalogItemId: item.item.id,
    locationId: locB.location.id,
    qty: "1",
    createdById: actor.id,
  });
  assert.equal(issue.ok, true);
  if (!issue.ok) throw new Error("issue failed");

  // Noise on another SKU must not appear in the product filter.
  const noiseReceipt = await postReceipt(prisma, {
    catalogItemId: noise.item.id,
    locationId: locA.location.id,
    qty: "99",
    createdById: actor.id,
  });
  assert.equal(noiseReceipt.ok, true);
  if (!noiseReceipt.ok) throw new Error("noise receipt failed");

  const history = await listRecentMovements(prisma, {
    catalogItemId: item.item.id,
    take: 50,
  });

  assert.ok(history.length >= 5, "opening + receipt + transfer pair + issue");
  assert.ok(
    history.every((r) => r.catalogItem.id === item.item.id),
    "product filter must exclude other SKUs",
  );
  assert.ok(!history.some((r) => r.catalogItem.id === noise.item.id));

  const types = new Set(history.map((r) => r.type));
  assert.ok(types.has("opening"), "opening stocktake movement present");
  assert.ok(types.has("receipt"), "receipt present");
  assert.ok(types.has("transfer"), "transfer present");
  assert.ok(types.has("issue"), "issue present");
  assert.equal(
    history.filter((r) => r.type === "transfer").length,
    2,
    "both transfer legs for the SKU",
  );

  // Newest-first
  for (let i = 1; i < history.length; i++) {
    assert.ok(
      history[i - 1]!.createdAt.getTime() >= history[i]!.createdAt.getTime(),
      "history must be newest-first",
    );
  }

  for (const row of history) {
    assert.ok(row.type);
    assert.ok(row.qty);
    assert.ok(row.location?.code);
    assert.ok(row.location?.label);
    assert.equal(row.createdBy?.id, actor.id);
    assert.ok(row.createdAt instanceof Date);
  }

  assert.ok(
    history.some((r) => r.id === opening.id),
    "opening row reachable via product filter",
  );
  assert.ok(history.some((r) => r.id === receipt.movement.id));
  assert.ok(history.some((r) => r.id === issue.movement.id));

  console.log(
    "prove-product-history-db: ok (opening/receipt/transfer/issue · newest-first · SKU filter)",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
