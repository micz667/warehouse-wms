/**
 * Discriminating F020 acceptance — needs Postgres.
 * Parallel allocate uniqueness; external barcode resolve; category change
 * does not renumber; prefix edit refused when items exist; import sourceRef.
 */
import "dotenv/config";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { allocateItemCode } from "../src/server/category-prefixes/allocate-item-code";
import { ensureCategoryPrefixesFromCsv } from "../src/server/category-prefixes/ensure-prefixes";
import { updateCategoryPrefix } from "../src/server/category-prefixes/update-category-prefix";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { findCatalogByBarcode } from "../src/server/catalog/find-catalog-by-barcode";
import { updateCatalogItem } from "../src/server/catalog/update-catalog-item";

async function main() {
  const suffix = Date.now().toString(36);
  await ensureCategoryPrefixesFromCsv(prisma);

  const category = `Meble / Siedzenia / Krzesła`;
  const prefixRow = await prisma.categoryPrefix.findUnique({
    where: { category },
  });
  assert.ok(prefixRow);
  assert.equal(prefixRow?.prefix, "KRZ");

  // 1) Parallel allocates — unique codes, no duplicates
  const parallel = await Promise.all(
    Array.from({ length: 12 }, () => allocateItemCode(prisma, category)),
  );
  const unique = new Set(parallel);
  assert.equal(
    unique.size,
    12,
    `expected 12 unique codes, got ${unique.size}: ${[...unique].join(",")}`,
  );
  for (const code of parallel) {
    assert.match(code, /^KRZ-\d+$/);
  }

  // 2) Create with manufacturer barcode → externalBarcode; warehouse code assigned
  const ean = `EAN${suffix}`;
  const created = await createCatalogItem(prisma, {
    name: `F020 chair ${suffix}`,
    category,
    unit: "szt",
    barcode: ean,
  });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("create with EAN failed");
  assert.match(created.item.sku, /^KRZ-\d+$/);
  assert.equal(created.item.barcode, created.item.sku);
  assert.equal(created.item.externalBarcode, ean);
  assert.equal((await findCatalogByBarcode(prisma, ean))?.id, created.item.id);
  assert.equal(
    (await findCatalogByBarcode(prisma, created.item.barcode))?.id,
    created.item.id,
  );

  const codeBefore = created.item.sku;

  // 3) Category change does NOT renumber
  const moved = await updateCatalogItem(prisma, created.item.id, {
    category: "Meble / Lampy",
  });
  assert.equal(moved.ok, true);
  if (!moved.ok) throw new Error("category update failed");
  assert.equal(moved.item.category, "Meble / Lampy");
  assert.equal(moved.item.sku, codeBefore);
  assert.equal(moved.item.barcode, codeBefore);

  // 4) Prefix edit refused once items use the prefix
  const blocked = await updateCategoryPrefix(prisma, prefixRow!.id, "XXX");
  assert.equal(blocked.ok, false);
  if (blocked.ok) throw new Error("expected prefix_in_use");
  assert.equal(blocked.error, "prefix_in_use");

  // 5) Unused prefix (fresh row) can be edited
  const freshCat = `F020 Fresh ${suffix}`;
  // Unique 3–4 letter prefixes (avoid collisions across prove re-runs).
  const alpha = suffix.replace(/[^a-z]/gi, "").toUpperCase();
  const pad = (alpha + "XYZW").slice(0, 4);
  const freshPrefix = pad.slice(0, 3);
  const renamedPrefix = pad.slice(0, 4);
  assert.notEqual(freshPrefix, renamedPrefix);
  const fresh = await prisma.categoryPrefix.create({
    data: { category: freshCat, prefix: freshPrefix, nextNumber: 1 },
  });
  const renamed = await updateCategoryPrefix(prisma, fresh.id, renamedPrefix);
  assert.equal(renamed.ok, true);
  if (!renamed.ok) throw new Error("prefix rename failed");
  assert.equal(renamed.row.prefix, renamedPrefix);

  // 6) Fallback for unknown category
  const fallback = await allocateItemCode(prisma, `Unknown Cat ${suffix}`);
  assert.match(fallback, /^INN-\d+$/);

  // 7) sourceRef uniqueness path (import identity)
  const ref = `poc:f020-${suffix}`;
  const imported = await createCatalogItem(prisma, {
    name: `Imported ${suffix}`,
    category: "Meble / Lampy",
    unit: "szt",
    sourceRef: ref,
  });
  assert.equal(imported.ok, true);
  if (!imported.ok) throw new Error("import create failed");
  assert.equal(imported.item.sourceRef, ref);
  const dupRef = await createCatalogItem(prisma, {
    name: `Dup ${suffix}`,
    category: "Meble / Lampy",
    unit: "szt",
    sourceRef: ref,
  });
  assert.equal(dupRef.ok, false);
  if (dupRef.ok) throw new Error("expected source_ref_taken");
  assert.equal(dupRef.error, "source_ref_taken");

  console.log(
    "prove-item-codes-db: ok (parallel allocate · external scan · immutable · prefix lock · sourceRef)",
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
