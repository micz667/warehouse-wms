/**
 * Discriminating acceptance for F008 — needs Postgres.
 * Architect creates draft + lines + submit; magazynier checks lines; done when all checked;
 * edit after submit blocked; history statuses visible as done.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { completeShoppingList } from "../src/server/shopping-lists/complete-shopping-list";
import { createShoppingList } from "../src/server/shopping-lists/create-shopping-list";
import { listShoppingLists } from "../src/server/shopping-lists/list-shopping-lists";
import { setShoppingListLineChecked } from "../src/server/shopping-lists/set-shopping-list-line-checked";
import { submitShoppingList } from "../src/server/shopping-lists/submit-shopping-list";
import { upsertShoppingListLine } from "../src/server/shopping-lists/upsert-shopping-list-line";

async function main() {
  const suffix = Date.now().toString(36);

  const itemA = await createCatalogItem(prisma, {
    sku: `SL-A-${suffix}`,
    name: `Zakup A ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(itemA.ok, true);
  if (!itemA.ok) throw new Error("catalog create A failed");

  const itemB = await createCatalogItem(prisma, {
    sku: `SL-B-${suffix}`,
    name: `Zakup B ${suffix}`,
    category: "Test",
    unit: "mb",
  });
  assert.equal(itemB.ok, true);
  if (!itemB.ok) throw new Error("catalog create B failed");

  const created = await createShoppingList(prisma, {
    title: `Lista prove ${suffix}`,
    note: "F008",
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("list create failed");
  assert.equal(created.list.status, "draft");
  const listId = created.list.id;

  const emptySubmit = await submitShoppingList(prisma, listId);
  assert.equal(emptySubmit.ok, false);
  if (emptySubmit.ok) throw new Error("expected empty submit blocked");
  assert.equal(emptySubmit.error, "empty");

  const lineA = await upsertShoppingListLine(prisma, {
    listId,
    catalogItemId: itemA.item.id,
    qty: 4,
    note: "na stół",
  });
  assert.equal(lineA.ok, true);
  if (!lineA.ok) throw new Error("line A failed");

  const lineB = await upsertShoppingListLine(prisma, {
    listId,
    catalogItemId: itemB.item.id,
    qty: "2.5",
  });
  assert.equal(lineB.ok, true);
  if (!lineB.ok) throw new Error("line B failed");

  const submitted = await submitShoppingList(prisma, listId);
  assert.equal(submitted.ok, true);
  if (!submitted.ok) throw new Error("submit failed");
  assert.equal(submitted.list.status, "submitted");
  assert.ok(submitted.list.submittedAt);

  const editBlocked = await upsertShoppingListLine(prisma, {
    listId,
    catalogItemId: itemA.item.id,
    qty: 99,
  });
  assert.equal(editBlocked.ok, false);
  if (editBlocked.ok) throw new Error("expected edit blocked");
  assert.equal(editBlocked.error, "invalid_status");

  const checkA = await setShoppingListLineChecked(prisma, {
    listId,
    lineId: lineA.line.id,
    checked: true,
    checkedById: null,
  });
  assert.equal(checkA.ok, true);
  if (!checkA.ok) throw new Error("check A failed");
  assert.ok(checkA.line.checkedAt);
  assert.equal(checkA.list.status, "submitted");

  const fulfillLists = await listShoppingLists(prisma, {
    statuses: ["submitted"],
  });
  assert.ok(fulfillLists.some((l) => l.id === listId));

  const checkB = await setShoppingListLineChecked(prisma, {
    listId,
    lineId: lineB.line.id,
    checked: true,
  });
  assert.equal(checkB.ok, true);
  if (!checkB.ok) throw new Error("check B failed");
  assert.equal(checkB.list.status, "done");
  assert.ok(checkB.list.doneAt);

  const history = await listShoppingLists(prisma, { statuses: ["done"] });
  assert.ok(history.some((l) => l.id === listId));

  // Second list: explicit complete without checking every line
  const created2 = await createShoppingList(prisma, {
    title: `Lista complete ${suffix}`,
  });
  assert.equal(created2.ok, true);
  if (!created2.ok) throw new Error("list2 create failed");
  const list2 = created2.list.id;
  const line2 = await upsertShoppingListLine(prisma, {
    listId: list2,
    catalogItemId: itemA.item.id,
    qty: 1,
  });
  assert.equal(line2.ok, true);
  const submitted2 = await submitShoppingList(prisma, list2);
  assert.equal(submitted2.ok, true);
  const completed = await completeShoppingList(prisma, list2);
  assert.equal(completed.ok, true);
  if (!completed.ok) throw new Error("complete failed");
  assert.equal(completed.list.status, "done");

  const checkOnDone = await setShoppingListLineChecked(prisma, {
    listId: list2,
    lineId: line2.ok ? line2.line.id : "",
    checked: true,
  });
  assert.equal(checkOnDone.ok, false);
  if (checkOnDone.ok) throw new Error("expected check on done blocked");
  assert.equal(checkOnDone.error, "invalid_status");

  console.log(
    "prove-shopping-lists-db: ok (create→submit→check→done; edit blocked; history)",
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
