/**
 * Fast F008 gates — no DB: create / fulfill / history role splits + UI seams.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gateRole } from "../src/server/gate-role";
import {
  SHOPPING_LIST_CREATE_ROLES,
  SHOPPING_LIST_FULFILL_ROLES,
  SHOPPING_LIST_HISTORY_ROLES,
  SHOPPING_LIST_READ_ROLES,
} from "../src/server/shopping-lists/roles";

function main() {
  assert.deepEqual(gateRole(undefined, SHOPPING_LIST_CREATE_ROLES), {
    ok: false,
    status: 401,
  });
  assert.deepEqual(gateRole("magazynier", SHOPPING_LIST_CREATE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("architekt", SHOPPING_LIST_CREATE_ROLES), {
    ok: true,
    role: "architekt",
  });
  assert.deepEqual(gateRole("admin", SHOPPING_LIST_CREATE_ROLES), {
    ok: true,
    role: "admin",
  });

  assert.deepEqual(gateRole("architekt", SHOPPING_LIST_FULFILL_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("magazynier", SHOPPING_LIST_FULFILL_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("admin", SHOPPING_LIST_FULFILL_ROLES), {
    ok: true,
    role: "admin",
  });

  assert.deepEqual(gateRole("magazynier", SHOPPING_LIST_HISTORY_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("architekt", SHOPPING_LIST_HISTORY_ROLES), {
    ok: true,
    role: "architekt",
  });
  assert.deepEqual(gateRole("magazynier", SHOPPING_LIST_READ_ROLES), {
    ok: true,
    role: "magazynier",
  });

  const submit = readFileSync(
    join(process.cwd(), "src/server/shopping-lists/submit-shopping-list.ts"),
    "utf8",
  );
  assert.match(submit, /status:\s*"submitted"/);
  assert.match(submit, /empty/);

  const check = readFileSync(
    join(
      process.cwd(),
      "src/server/shopping-lists/set-shopping-list-line-checked.ts",
    ),
    "utf8",
  );
  assert.match(check, /checkedAt/);
  assert.match(check, /status:\s*"done"/);

  const hub = readFileSync(join(process.cwd(), "src/app/zakupy/page.tsx"), "utf8");
  assert.match(hub, /ShoppingListIndex/);
  assert.match(hub, /SHOPPING_LIST_CREATE_ROLES/);
  assert.match(hub, /SHOPPING_LIST_HISTORY_ROLES/);

  const home = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
  assert.match(home, /\/zakupy/);
  assert.match(home, /Listy zakupów/);

  console.log(
    "prove-shopping-lists: ok (create architekt · fulfill magazynier · history · UI seams)",
  );
}

main();
