import assert from "node:assert/strict";
import { generateBarcodeValue } from "../src/server/catalog/generate-barcode";
import { gateRole } from "../src/server/gate-role";
import {
  CATALOG_READ_ROLES,
  CATALOG_WRITE_ROLES,
} from "../src/server/catalog/roles";

function main() {
  const a = generateBarcodeValue();
  const b = generateBarcodeValue();
  assert.match(a, /^WMS[0-9A-F]{12}$/);
  assert.match(b, /^WMS[0-9A-F]{12}$/);
  assert.notEqual(a, b);

  assert.deepEqual(gateRole(undefined, CATALOG_WRITE_ROLES), {
    ok: false,
    status: 401,
  });
  assert.deepEqual(gateRole("architekt", CATALOG_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("magazynier", CATALOG_WRITE_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("admin", CATALOG_WRITE_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("architekt", CATALOG_READ_ROLES), {
    ok: true,
    role: "architekt",
  });

  console.log("prove-catalog: ok (Code128 value shape + write/read gates)");
}

main();
