/**
 * Fast F020 gates — no DB: code format, PL→ASCII, immutability seams in
 * update/create/import/UI, admin prefix page, label shows short code + name.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FALLBACK_CATEGORY,
  FALLBACK_PREFIX,
  PREFIX_PATTERN,
} from "../src/server/category-prefixes/constants";
import {
  formatItemCode,
  parseItemCode,
} from "../src/server/category-prefixes/format-item-code";
import { loadPrefixCsv } from "../src/server/category-prefixes/load-prefix-csv";
import { normalizePrefixLetters } from "../src/server/category-prefixes/normalize-prefix";
import { CATEGORY_PREFIX_ADMIN_ROLES } from "../src/server/category-prefixes/roles";
import { gateRole } from "../src/server/gate-role";

function main() {
  assert.equal(formatItemCode("KRZ", 1), "KRZ-0001");
  assert.equal(formatItemCode("KRZ", 42), "KRZ-0042");
  assert.equal(formatItemCode("INN", 10000), "INN-10000");
  assert.deepEqual(parseItemCode("FOT-0059"), { prefix: "FOT", number: 59 });
  assert.equal(parseItemCode("R-abc"), null);

  assert.equal(normalizePrefixLetters("Ławki"), "LAWKI");
  assert.equal(normalizePrefixLetters("żółć"), "ZOLC");
  assert.ok(PREFIX_PATTERN.test("KRZ"));
  assert.ok(PREFIX_PATTERN.test("HVAC"));
  assert.ok(!PREFIX_PATTERN.test("K"));
  assert.ok(!PREFIX_PATTERN.test("TOOLONG"));

  assert.equal(FALLBACK_CATEGORY, "Bez kategorii");
  assert.equal(FALLBACK_PREFIX, "INN");

  const csv = loadPrefixCsv();
  assert.ok(csv.length >= 40, `expected many prefix rows, got ${csv.length}`);
  const krz = csv.find((r) => r.category === "Meble / Siedzenia / Krzesła");
  assert.equal(krz?.prefix, "KRZ");
  const pkr = csv.find((r) => r.category === "Meble / Poduchy / Krzesła");
  assert.equal(pkr?.prefix, "PKR");
  const min = csv.find((r) => r.category === "Meble / Inne");
  assert.equal(min?.prefix, "MIN");
  const prefixes = new Set(csv.map((r) => r.prefix));
  assert.equal(prefixes.size, csv.length, "CSV prefixes must be unique");

  assert.deepEqual(gateRole("magazynier", CATEGORY_PREFIX_ADMIN_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("admin", CATEGORY_PREFIX_ADMIN_ROLES), {
    ok: true,
    role: "admin",
  });

  const update = readFileSync(
    join(process.cwd(), "src/server/catalog/update-catalog-item.ts"),
    "utf8",
  );
  assert.match(update, /does NOT renumber|immutable/i);
  assert.doesNotMatch(update, /data\.sku\s*=/);

  const create = readFileSync(
    join(process.cwd(), "src/server/catalog/create-catalog-item.ts"),
    "utf8",
  );
  assert.match(create, /allocateItemCode/);
  assert.match(create, /externalBarcode/);

  const importScript = readFileSync(
    join(process.cwd(), "scripts/import-poc-catalog.ts"),
    "utf8",
  );
  assert.match(importScript, /pocSourceRef/);
  assert.match(importScript, /sourceRef/);
  assert.match(importScript, /allocateItemCode/);
  assert.doesNotMatch(importScript, /export function pocSku/);
  assert.doesNotMatch(importScript, /export function pocBarcode/);
  assert.doesNotMatch(importScript, /createHash/);

  const edit = readFileSync(
    join(process.cwd(), "src/components/catalog-edit-form.tsx"),
    "utf8",
  );
  assert.match(edit, /catalog-code-readonly/);
  assert.match(edit, /Kategoria \(bieżąca\)/);

  const label = readFileSync(
    join(process.cwd(), "src/app/katalog/[id]/etykieta/page.tsx"),
    "utf8",
  );
  assert.match(label, /item\.name/);
  assert.match(label, /item\.barcode/);
  assert.match(label, /BarcodeLabel/);

  const adminPage = readFileSync(
    join(process.cwd(), "src/app/prefiksy/page.tsx"),
    "utf8",
  );
  assert.match(adminPage, /CategoryPrefixPanel/);
  assert.match(adminPage, /CATEGORY_PREFIX_ADMIN_ROLES/);

  console.log(
    "prove-item-codes: ok (format · CSV map · immutability seams · admin · label)",
  );
}

main();
