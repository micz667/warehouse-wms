/**
 * Discriminating acceptance for F011 — needs Postgres.
 * Known barcode receipt; unknown barcode → create with scanned code → receipt;
 * new item searchable by barcode.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { findCatalogByBarcode } from "../src/server/catalog/find-catalog-by-barcode";
import { listCatalogItems } from "../src/server/catalog/list-catalog-items";
import { createLocation } from "../src/server/locations/create-location";
import { postReceipt } from "../src/server/movements/post-receipt";
import { sumMovementQty } from "../src/server/stock/sum-movement-qty";

async function main() {
  const suffix = Date.now().toString(36);

  const actor = await prisma.user.create({
    data: {
      email: `f011-${suffix}@prove.local`,
      passwordHash: "unused",
      name: `F011 Actor ${suffix}`,
      role: "magazynier",
    },
  });

  const loc = await createLocation(prisma, {
    code: `F11-${suffix}`,
    label: `F011 loc ${suffix}`,
  });
  assert.equal(loc.ok, true);
  if (!loc.ok) throw new Error("location failed");

  // 1) Known barcode → receipt at chosen location for entered qty
  const known = await createCatalogItem(prisma, {
    name: `F011 known ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  assert.equal(known.ok, true);
  if (!known.ok) throw new Error("known catalog create failed");

  const receiptKnown = await postReceipt(prisma, {
    catalogItemId: known.item.id,
    locationId: loc.location.id,
    qty: "7",
    createdById: actor.id,
  });
  assert.equal(receiptKnown.ok, true);
  if (!receiptKnown.ok) throw new Error("known receipt failed");
  assert.equal(receiptKnown.movement.type, "receipt");
  assert.equal(receiptKnown.movement.qty.toString(), "7");
  assert.equal(
    (
      await sumMovementQty(prisma, {
        catalogItemId: known.item.id,
        locationId: loc.location.id,
      })
    ).toString(),
    "7",
  );

  // 2–3) Unknown barcode → create with that barcode → receipt on new row
  const scanned = `UNK${suffix}`;
  assert.equal(await findCatalogByBarcode(prisma, scanned), null);

  const created = await createCatalogItem(prisma, {
    name: `F011 inline ${suffix}`,
    category: "farba, wnętrze",
    unit: "szt",
    description: `Opis poc ${suffix}`,
    barcode: scanned,
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("inline catalog create failed");
  // Warehouse code is category-prefix; scanned manufacturer code is external.
  assert.match(created.item.sku, /^[A-Z]{2,4}-\d+$/);
  assert.equal(created.item.barcode, created.item.sku);
  assert.equal(created.item.externalBarcode, scanned);
  assert.equal(created.item.description, `Opis poc ${suffix}`);

  const receiptNew = await postReceipt(prisma, {
    catalogItemId: created.item.id,
    locationId: loc.location.id,
    qty: "3",
    createdById: actor.id,
  });
  assert.equal(receiptNew.ok, true);
  if (!receiptNew.ok) throw new Error("inline receipt failed");
  assert.equal(receiptNew.movement.catalogItemId, created.item.id);
  assert.equal(receiptNew.movement.qty.toString(), "3");

  // 4) New item resolves by manufacturer barcode and warehouse code
  const byBarcode = await findCatalogByBarcode(prisma, scanned);
  assert.ok(byBarcode);
  assert.equal(byBarcode?.id, created.item.id);
  const byWarehouse = await findCatalogByBarcode(prisma, created.item.barcode);
  assert.equal(byWarehouse?.id, created.item.id);

  const listed = await listCatalogItems(prisma, scanned);
  assert.ok(
    listed.some(
      (row) =>
        row.id === created.item.id && row.externalBarcode === scanned,
    ),
    "search by manufacturer barcode must return the inline-created item",
  );

  const listedByDesc = await listCatalogItems(prisma, `Opis poc ${suffix}`);
  assert.ok(
    listedByDesc.some((row) => row.id === created.item.id),
    "search by description must return the inline-created item",
  );

  console.log(
    "prove-receive-scan-db: ok (known receipt · inline create+receipt · catalog search)",
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
