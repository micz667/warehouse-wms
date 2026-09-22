import assert from "node:assert/strict";
import { gateRole } from "../src/server/gate-role";
import {
  STOCK_READ_ROLES,
  STOCKTAKE_READ_ROLES,
  STOCKTAKE_WRITE_ROLES,
} from "../src/server/stocktake/roles";

function main() {
  assert.deepEqual(gateRole(undefined, STOCKTAKE_WRITE_ROLES), {
    ok: false,
    status: 401,
  });
  assert.deepEqual(gateRole("architekt", STOCKTAKE_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("magazynier", STOCKTAKE_WRITE_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("admin", STOCKTAKE_WRITE_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("architekt", STOCKTAKE_READ_ROLES), {
    ok: true,
    role: "architekt",
  });
  assert.deepEqual(gateRole("magazynier", STOCK_READ_ROLES), {
    ok: true,
    role: "magazynier",
  });

  console.log(
    "prove-stocktake: ok (magazynier/admin write · all roles read)",
  );
}

main();
