import assert from "node:assert/strict";
import { formatItemCode, parseItemCode } from "../src/server/category-prefixes/format-item-code";
import { normalizePrefixLetters } from "../src/server/category-prefixes/normalize-prefix";
import { gateRole } from "../src/server/gate-role";
import {
  CATALOG_READ_ROLES,
  CATALOG_WRITE_ROLES,
} from "../src/server/catalog/roles";

function main() {
  assert.equal(formatItemCode("KRZ", 42), "KRZ-0042");
  assert.equal(formatItemCode("INN", 10000), "INN-10000");
  assert.deepEqual(parseItemCode("KRZ-0042"), { prefix: "KRZ", number: 42 });
  assert.equal(normalizePrefixLetters("Ławka"), "LAWKA");
  assert.equal(normalizePrefixLetters("żółć"), "ZOLC");

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

  console.log("prove-catalog: ok (item code shape · PL→ASCII · write/read gates)");
}

main();
