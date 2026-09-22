import assert from "node:assert/strict";
import { gateRole } from "../src/server/gate-role";
import { normalizeLocationCode } from "../src/server/locations/normalize-location-code";
import {
  LOCATION_READ_ROLES,
  LOCATION_WRITE_ROLES,
} from "../src/server/locations/roles";

function main() {
  assert.equal(normalizeLocationCode("  a-01 02 "), "A-01-02");
  assert.equal(normalizeLocationCode("REGAL.1"), "REGAL.1");
  assert.equal(normalizeLocationCode(""), null);
  assert.equal(normalizeLocationCode("!!!"), null);
  assert.equal(normalizeLocationCode("a".repeat(65)), null);

  assert.deepEqual(gateRole(undefined, LOCATION_WRITE_ROLES), {
    ok: false,
    status: 401,
  });
  assert.deepEqual(gateRole("magazynier", LOCATION_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("architekt", LOCATION_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("admin", LOCATION_WRITE_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("magazynier", LOCATION_READ_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("architekt", LOCATION_READ_ROLES), {
    ok: true,
    role: "architekt",
  });

  console.log(
    "prove-locations: ok (code normalize + admin write / hall read gates)",
  );
}

main();
