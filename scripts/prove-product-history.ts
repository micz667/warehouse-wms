/**
 * Fast F014 gates — no DB: product history reachability, hall vs audit auth,
 * hub/product deep-links, list always sends catalogItemId when product-scoped.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  hubGestureHref,
  missingFieldsAfterHubScan,
} from "../src/lib/hub-gesture-fields";
import { gateRole } from "../src/server/gate-role";
import { movementListRequiresAudit } from "../src/server/movements/movement-list-requires-audit";
import {
  MOVEMENT_AUDIT_ROLES,
  MOVEMENT_READ_ROLES,
} from "../src/server/movements/roles";

function main() {
  // Solo catalogItemId is hall-readable; date/location/actor stay admin audit.
  assert.equal(
    movementListRequiresAudit({ catalogItemId: "item-1" }),
    false,
    "product-only filter must not require audit",
  );
  assert.equal(
    movementListRequiresAudit({
      catalogItemId: "item-1",
      from: "2026-01-01T00:00:00.000Z",
    }),
    true,
  );
  assert.equal(movementListRequiresAudit({ locationId: "loc-1" }), true);
  assert.equal(movementListRequiresAudit({ createdById: "user-1" }), true);
  assert.equal(
    movementListRequiresAudit({ to: "2026-01-02T00:00:00.000Z" }),
    true,
  );
  assert.equal(movementListRequiresAudit({}), false);

  assert.deepEqual(gateRole("magazynier", MOVEMENT_READ_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("magazynier", MOVEMENT_AUDIT_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("admin", MOVEMENT_AUDIT_ROLES), {
    ok: true,
    role: "admin",
  });

  // Hub: after item scan, Historia needs nothing else.
  assert.deepEqual(missingFieldsAfterHubScan("item", "historia"), []);
  assert.deepEqual(missingFieldsAfterHubScan("location", "historia"), [
    "item",
  ]);

  const historiaHref = hubGestureHref("historia", {
    kind: "item",
    id: "item-9",
  });
  assert.equal(historiaHref, "/ruchy/historia?catalogItemId=item-9");

  const api = readFileSync(
    join(process.cwd(), "src/app/api/movements/route.ts"),
    "utf8",
  );
  assert.match(api, /movementListRequiresAudit/);
  assert.match(api, /MOVEMENT_READ_ROLES/);
  assert.match(api, /MOVEMENT_AUDIT_ROLES/);

  const listUi = readFileSync(
    join(process.cwd(), "src/components/movement-history-list.tsx"),
    "utf8",
  );
  assert.match(listUi, /initialCatalogItemId/);
  assert.match(listUi, /productScoped/);
  assert.match(listUi, /Historia pozycji/);
  assert.match(listUi, /TYPE_LABEL_PL/);
  assert.match(listUi, /Wykonał:/);
  assert.match(listUi, /movement-row/);

  const page = readFileSync(
    join(process.cwd(), "src/app/ruchy/historia/page.tsx"),
    "utf8",
  );
  assert.match(page, /catalogItemId/);
  assert.match(page, /initialCatalogItemId/);
  assert.match(page, /productLabel/);
  assert.doesNotMatch(page, /MOVEMENT_AUDIT_ROLES/);

  const catalog = readFileSync(
    join(process.cwd(), "src/components/catalog-edit-form.tsx"),
    "utf8",
  );
  assert.match(catalog, /\/ruchy\/historia\?catalogItemId=/);
  assert.match(catalog, /catalog-history-link/);

  const hub = readFileSync(
    join(process.cwd(), "src/components/scan-hub.tsx"),
    "utf8",
  );
  assert.match(hub, /Historia/);
  assert.match(hub, /\/ruchy\/historia/);
  assert.match(hub, /gesture:\s*"historia"/);
  assert.match(hub, /hub-gesture-\$\{choice\.gesture\}/);

  const hubFields = readFileSync(
    join(process.cwd(), "src/lib/hub-gesture-fields.ts"),
    "utf8",
  );
  assert.match(hubFields, /"historia"/);
  assert.match(hubFields, /catalogItemId/);

  console.log(
    "prove-product-history: ok (product filter read · hub/card reach · list seams)",
  );
}

main();
