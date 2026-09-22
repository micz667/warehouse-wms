/**
 * Fast F006 gates — no DB: schema has no writable stock qty; stock list is read-only.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function main() {
  const schema = readFileSync(
    join(process.cwd(), "prisma/schema.prisma"),
    "utf8",
  );

  assert.equal(
    /model\s+ItemLocation\b/.test(schema),
    false,
    "no ItemLocation model",
  );
  assert.match(
    schema,
    /Stock quantity must never be a writable/,
    "schema documents movement-only stock",
  );
  assert.match(
    schema,
    /enum\s+MovementType\s*\{[\s\S]*?\bopening\b[\s\S]*?\breceipt\b[\s\S]*?\bissue\b[\s\S]*?\btransfer\b/,
    "MovementType includes opening/receipt/issue/transfer",
  );

  const stockModule = readFileSync(
    join(process.cwd(), "src/server/stock/sum-movement-qty.ts"),
    "utf8",
  );
  assert.match(
    stockModule,
    /export async function sumMovementQty/,
    "sumMovementQty is the stock sum seam",
  );

  const api = readFileSync(
    join(process.cwd(), "src/app/api/stock/route.ts"),
    "utf8",
  );
  assert.match(api, /listStockBalances/, "GET /api/stock uses listStockBalances");
  assert.equal(
    /prisma\.(catalogItem|location)\.update/.test(api),
    false,
    "stock API must not write qty onto catalog/location",
  );

  const ui = readFileSync(
    join(process.cwd(), "src/components/stock-balance-list.tsx"),
    "utf8",
  );
  assert.equal(/<input\b/.test(ui), false, "no qty input on /stany");
  assert.match(ui, /fetch\(["']\/api\/stock["']\)/);

  console.log(
    "prove-stock-from-movements: ok (no raw qty column/UI · sumMovementQty seam · /api/stock read)",
  );
}

main();
