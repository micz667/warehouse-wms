/**
 * Fast F011 gates — no DB: Przyjmij unknown-barcode → inline create seams;
 * catalog create accepts scanned barcode; SKU helper; no nested forms.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { skuFromScannedBarcode } from "../src/lib/sku-from-scanned-barcode";

function main() {
  assert.equal(skuFromScannedBarcode("ABC-123"), "R-ABC-123");
  assert.match(skuFromScannedBarcode("  x!y@z  "), /^R-xyz$/);

  const receipt = readFileSync(
    join(process.cwd(), "src/components/receipt-form.tsx"),
    "utf8",
  );
  assert.match(receipt, /InlineCatalogCreate/);
  assert.match(receipt, /onUnknownBarcode/);
  assert.match(receipt, /unknownBarcode/);

  const inline = readFileSync(
    join(process.cwd(), "src/components/inline-catalog-create.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    inline,
    /<form\b/,
    "InlineCatalogCreate must not nest a <form> inside ReceiptForm",
  );
  assert.match(inline, /data-testid="inline-catalog-create"/);
  assert.match(inline, /Nazwa/);
  assert.match(inline, /Tagi/);
  assert.match(inline, /Opis/);
  assert.match(inline, /Kod kreskowy/);
  assert.match(inline, /data-testid="inline-item-name"/);
  assert.match(inline, /data-testid="inline-item-tags"/);
  assert.match(inline, /data-testid="inline-item-description"/);
  assert.match(inline, /data-testid="inline-item-barcode"/);
  assert.match(inline, /\/api\/catalog/);
  assert.match(inline, /barcode/);

  const itemScan = readFileSync(
    join(process.cwd(), "src/components/item-scan-field.tsx"),
    "utf8",
  );
  assert.match(itemScan, /onUnknownBarcode/);
  assert.match(itemScan, /status === 404/);
  assert.doesNotMatch(itemScan, /<form\b/);

  const create = readFileSync(
    join(process.cwd(), "src/server/catalog/create-catalog-item.ts"),
    "utf8",
  );
  assert.match(create, /skuFromScannedBarcode/);
  assert.match(create, /description/);

  const catalogApi = readFileSync(
    join(process.cwd(), "src/app/api/catalog/route.ts"),
    "utf8",
  );
  assert.match(catalogApi, /barcode/);
  assert.match(catalogApi, /description/);

  console.log(
    "prove-receive-scan: ok (inline create seams · barcode create · no nested form)",
  );
}

main();
