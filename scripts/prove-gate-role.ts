import assert from "node:assert/strict";
import { gateRole } from "../src/server/gate-role";

function main() {
  assert.deepEqual(gateRole(undefined, ["admin"]), {
    ok: false,
    status: 401,
  });
  assert.deepEqual(gateRole(null, ["admin"]), { ok: false, status: 401 });
  assert.deepEqual(gateRole("magazynier", ["admin"]), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("architekt", ["admin"]), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("admin", ["admin"]), { ok: true, role: "admin" });
  assert.deepEqual(gateRole("magazynier", ["magazynier", "admin"]), {
    ok: true,
    role: "magazynier",
  });
  console.log("prove-gate-role: ok");
}

main();
