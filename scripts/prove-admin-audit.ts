/**
 * Fast F009 gates — no DB: admin user/audit roles + UI/API seams.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gateRole } from "../src/server/gate-role";
import { MOVEMENT_AUDIT_ROLES } from "../src/server/movements/roles";
import {
  USER_READ_ROLES,
  USER_WRITE_ROLES,
  isValidRole,
} from "../src/server/users/roles";

function main() {
  assert.deepEqual(gateRole(undefined, USER_WRITE_ROLES), {
    ok: false,
    status: 401,
  });
  assert.deepEqual(gateRole("magazynier", USER_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("architekt", USER_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("admin", USER_WRITE_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("admin", USER_READ_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("magazynier", MOVEMENT_AUDIT_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("admin", MOVEMENT_AUDIT_ROLES), {
    ok: true,
    role: "admin",
  });

  assert.equal(isValidRole("magazynier"), true);
  assert.equal(isValidRole("architekt"), true);
  assert.equal(isValidRole("admin"), true);
  assert.equal(isValidRole("guest"), false);

  const listMovements = readFileSync(
    join(process.cwd(), "src/server/movements/list-recent-movements.ts"),
    "utf8",
  );
  assert.match(listMovements, /catalogItemId/);
  assert.match(listMovements, /locationId/);
  assert.match(listMovements, /createdById/);
  assert.match(listMovements, /createdAt/);

  const movementsApi = readFileSync(
    join(process.cwd(), "src/app/api/movements/route.ts"),
    "utf8",
  );
  assert.match(movementsApi, /MOVEMENT_AUDIT_ROLES/);
  assert.match(movementsApi, /movementListRequiresAudit/);
  assert.match(movementsApi, /catalogItemId/);
  assert.match(movementsApi, /createdById/);

  const auditGate = readFileSync(
    join(process.cwd(), "src/server/movements/movement-list-requires-audit.ts"),
    "utf8",
  );
  assert.match(auditGate, /locationId/);
  assert.match(auditGate, /createdById/);
  assert.match(auditGate, /from/);
  // Solo catalogItemId must remain hall-readable (F014) — not an audit trigger.
  assert.doesNotMatch(
    auditGate,
    /hasValue\(params\.catalogItemId\)/,
    "catalogItemId-only must not force audit roles",
  );

  const usersApi = readFileSync(
    join(process.cwd(), "src/app/api/users/route.ts"),
    "utf8",
  );
  assert.match(usersApi, /USER_WRITE_ROLES/);
  assert.match(usersApi, /createUser/);

  const rolePatch = readFileSync(
    join(process.cwd(), "src/app/api/users/[id]/route.ts"),
    "utf8",
  );
  assert.match(rolePatch, /updateUserRole/);

  const usersPage = readFileSync(
    join(process.cwd(), "src/app/uzytkownicy/page.tsx"),
    "utf8",
  );
  assert.match(usersPage, /UserAdminPanel/);
  assert.match(usersPage, /USER_READ_ROLES/);

  const auditPage = readFileSync(
    join(process.cwd(), "src/app/audyt/page.tsx"),
    "utf8",
  );
  assert.match(auditPage, /showFilters/);
  assert.match(auditPage, /MOVEMENT_AUDIT_ROLES/);

  const historyUi = readFileSync(
    join(process.cwd(), "src/components/movement-history-list.tsx"),
    "utf8",
  );
  assert.match(historyUi, /movement-filters/);
  assert.match(historyUi, /filter-catalog/);
  assert.match(historyUi, /filter-actor/);

  const home = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
  assert.match(home, /\/uzytkownicy/);
  assert.match(home, /\/audyt/);

  console.log(
    "prove-admin-audit: ok (admin user/audit gates · filter + UI seams)",
  );
}

main();
