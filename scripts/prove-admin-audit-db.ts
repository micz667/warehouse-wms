/**
 * Discriminating acceptance for F009 — needs Postgres.
 * Admin can change a user role; movement filters narrow F005/F007 posts.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";
import { listRecentMovements } from "../src/server/movements/list-recent-movements";
import { postReceipt } from "../src/server/movements/post-receipt";
import { createUser } from "../src/server/users/create-user";
import { listUsers } from "../src/server/users/list-users";
import { updateUserRole } from "../src/server/users/update-user-role";

async function main() {
  const suffix = Date.now().toString(36);

  // 1) Admin create user + change role
  const created = await createUser(prisma, {
    email: `f009-${suffix}@prove.local`,
    password: "prove-pass-9",
    name: `F009 User ${suffix}`,
    role: "magazynier",
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("createUser failed");
  assert.equal(created.user.role, "magazynier");

  const promoted = await updateUserRole(prisma, {
    userId: created.user.id,
    role: "architekt",
  });
  assert.equal(promoted.ok, true);
  if (!promoted.ok) throw new Error("updateUserRole failed");
  assert.equal(promoted.user.role, "architekt");

  const listed = await listUsers(prisma);
  const found = listed.find((u) => u.id === created.user.id);
  assert.ok(found);
  assert.equal(found?.role, "architekt");

  // Second actor for filter discrimination
  const actorB = await createUser(prisma, {
    email: `f009-b-${suffix}@prove.local`,
    password: "prove-pass-9",
    name: `F009 ActorB ${suffix}`,
    role: "magazynier",
  });
  assert.equal(actorB.ok, true);
  if (!actorB.ok) throw new Error("actorB create failed");

  const itemA = await createCatalogItem(prisma, {
    name: `F009 item A ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemA.ok, true);
  if (!itemA.ok) throw new Error("itemA failed");

  const itemB = await createCatalogItem(prisma, {
    name: `F009 item B ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemB.ok, true);
  if (!itemB.ok) throw new Error("itemB failed");

  const locA = await createLocation(prisma, {
    code: `F9A-${suffix}`,
    label: `F009 loc A ${suffix}`,
  });
  assert.equal(locA.ok, true);
  if (!locA.ok) throw new Error("locA failed");

  const locB = await createLocation(prisma, {
    code: `F9B-${suffix}`,
    label: `F009 loc B ${suffix}`,
  });
  assert.equal(locB.ok, true);
  if (!locB.ok) throw new Error("locB failed");

  // F005-style opening + F007 receipt on different actors/items/locations
  const opening = await prisma.movement.create({
    data: {
      type: "opening",
      catalogItemId: itemA.item.id,
      locationId: locA.location.id,
      qty: "5",
      createdById: created.user.id,
    },
  });

  const receipt = await postReceipt(prisma, {
    catalogItemId: itemB.item.id,
    locationId: locB.location.id,
    qty: "3",
    createdById: actorB.user.id,
  });
  assert.equal(receipt.ok, true);
  if (!receipt.ok) throw new Error("receipt failed");

  // Noise: same actor, other item — must drop when filtering by itemA
  await postReceipt(prisma, {
    catalogItemId: itemB.item.id,
    locationId: locA.location.id,
    qty: "1",
    createdById: created.user.id,
  });

  // 2) Filters narrow results
  const byItem = await listRecentMovements(prisma, {
    catalogItemId: itemA.item.id,
    take: 50,
  });
  assert.ok(byItem.some((r) => r.id === opening.id));
  assert.ok(byItem.every((r) => r.catalogItem.id === itemA.item.id));
  assert.ok(
    !byItem.some((r) => r.id === receipt.movement.id),
    "item filter must exclude other catalog items",
  );

  const byLocation = await listRecentMovements(prisma, {
    locationId: locB.location.id,
    take: 50,
  });
  assert.ok(byLocation.some((r) => r.id === receipt.movement.id));
  assert.ok(byLocation.every((r) => r.location.id === locB.location.id));

  const byActor = await listRecentMovements(prisma, {
    createdById: actorB.user.id,
    take: 50,
  });
  assert.ok(byActor.some((r) => r.id === receipt.movement.id));
  assert.ok(byActor.every((r) => r.createdBy?.id === actorB.user.id));
  assert.ok(!byActor.some((r) => r.id === opening.id));

  const dayStart = new Date(opening.createdAt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(opening.createdAt);
  dayEnd.setHours(23, 59, 59, 999);

  const byDate = await listRecentMovements(prisma, {
    from: dayStart,
    to: dayEnd,
    catalogItemId: itemA.item.id,
    take: 50,
  });
  assert.ok(byDate.some((r) => r.id === opening.id && r.type === "opening"));

  const farPast = await listRecentMovements(prisma, {
    from: "2000-01-01T00:00:00.000Z",
    to: "2000-01-02T00:00:00.000Z",
    catalogItemId: itemA.item.id,
    take: 50,
  });
  assert.equal(
    farPast.length,
    0,
    "date filter outside range must return empty",
  );

  // Combined: actor + location must leave only receipt
  const combined = await listRecentMovements(prisma, {
    createdById: actorB.user.id,
    locationId: locB.location.id,
    catalogItemId: itemB.item.id,
    take: 50,
  });
  assert.ok(combined.some((r) => r.type === "receipt"));
  assert.ok(combined.every((r) => r.createdBy?.id === actorB.user.id));
  assert.ok(combined.every((r) => r.location.id === locB.location.id));

  console.log(
    "prove-admin-audit-db: ok (role change · filters narrow opening/receipt)",
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
