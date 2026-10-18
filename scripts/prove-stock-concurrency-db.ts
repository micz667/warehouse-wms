/**
 * F019 — parallel stock decrements must not drive a location negative.
 * Needs Postgres (advisory locks + default Read Committed transactions).
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { postIssue } from "../src/server/movements/post-issue";
import { postReceipt } from "../src/server/movements/post-receipt";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f019-stock-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F019 Stock ${suffix}`,
      role: "magazynier",
    },
  });

  const item = await createCatalogItem(prisma, {
    name: `F019 stock race ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(item.ok, true);
  if (!item.ok) throw new Error("catalog failed");

  const loc = await createLocation(prisma, {
    code: `F019S-${suffix}`,
    label: `F019 stock ${suffix}`,
  });
  assert.equal(loc.ok, true);
  if (!loc.ok) throw new Error("location failed");

  const seeded = await postReceipt(prisma, {
    catalogItemId: item.item.id,
    locationId: loc.location.id,
    qty: "10",
    createdById: actor.id,
  });
  assert.equal(seeded.ok, true);
  if (!seeded.ok) throw new Error("receipt failed");

  // Ten parallel issues of 3 against balance 10 — without locks, several would
  // pass the balance check and leave a negative sum.
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      postIssue(prisma, {
        catalogItemId: item.item.id,
        locationId: loc.location.id,
        qty: "3",
        createdById: actor.id,
      }),
    ),
  );

  const okCount = results.filter((r) => r.ok).length;
  const refused = results.filter(
    (r) => !r.ok && r.error === "insufficient_stock",
  ).length;

  assert.equal(okCount, 3, `expected 3 successful issues, got ${okCount}`);
  assert.equal(refused, 7, `expected 7 insufficient_stock, got ${refused}`);

  const balance = await sumMovementQty(prisma, {
    catalogItemId: item.item.id,
    locationId: loc.location.id,
  });
  assert.equal(balance.toString(), "1");
  assert.ok(balance.gte(0), "balance must not be negative");

  console.log(
    "prove-stock-concurrency-db: ok (parallel issues · no negative stock)",
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
