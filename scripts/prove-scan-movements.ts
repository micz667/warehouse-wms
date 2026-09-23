/**
 * Fast F007 gates — no DB: roles, transfer pairing contract, UI seams.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gateRole } from "../src/server/gate-role";
import {
  MOVEMENT_READ_ROLES,
  MOVEMENT_WRITE_ROLES,
} from "../src/server/movements/roles";

function main() {
  assert.deepEqual(gateRole(undefined, MOVEMENT_WRITE_ROLES), {
    ok: false,
    status: 401,
  });
  assert.deepEqual(gateRole("architekt", MOVEMENT_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("magazynier", MOVEMENT_WRITE_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("admin", MOVEMENT_WRITE_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("architekt", MOVEMENT_READ_ROLES), {
    ok: true,
    role: "architekt",
  });

  const transfer = readFileSync(
    join(process.cwd(), "src/server/movements/post-transfer.ts"),
    "utf8",
  );
  assert.match(
    transfer,
    /type:\s*"transfer"/,
    "transfer posts MovementType transfer",
  );
  assert.match(
    transfer,
    /qty:\s*parsed\.qty\.neg\(\)/,
    "transfer decreases source",
  );
  assert.match(
    transfer,
    /qty:\s*parsed\.qty(?!\.neg)/,
    "transfer increases destination",
  );

  const issue = readFileSync(
    join(process.cwd(), "src/server/movements/post-issue.ts"),
    "utf8",
  );
  assert.match(
    issue,
    /insufficient_stock/,
    "issue refuses when balance would go negative",
  );
  assert.match(issue, /balance\.lt\(parsed\.qty\)/);

  const receipt = readFileSync(
    join(process.cwd(), "src/server/movements/post-receipt.ts"),
    "utf8",
  );
  assert.match(receipt, /type:\s*"receipt"/);

  const scanner = readFileSync(
    join(process.cwd(), "src/components/barcode-scanner.tsx"),
    "utf8",
  );
  assert.match(scanner, /getUserMedia/);
  assert.match(scanner, /@zxing\/browser/);

  // Nested <form> inside parent movement forms causes React hydration errors.
  const itemScan = readFileSync(
    join(process.cwd(), "src/components/item-scan-field.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    itemScan,
    /<form\b/,
    "ItemScanField must not nest a <form> (used inside Receipt/Transfer/Issue forms)",
  );
  assert.match(itemScan, /onKeyDown/, "manual barcode Enter still handled");
  assert.match(itemScan, /type="button"/, "Użyj is type=button, not submit");

  const locationField = readFileSync(
    join(process.cwd(), "src/components/location-field.tsx"),
    "utf8",
  );
  assert.doesNotMatch(
    locationField,
    /<form\b/,
    "LocationField must not nest a <form> (used inside Receipt/Transfer/Issue forms)",
  );
  assert.match(locationField, /onKeyDown/, "manual location Enter still handled");
  assert.match(locationField, /type="button"/, "Użyj is type=button, not submit");

  const hub = readFileSync(
    join(process.cwd(), "src/app/ruchy/page.tsx"),
    "utf8",
  );
  assert.match(hub, /\/ruchy\/przyjecie/);
  assert.match(hub, /\/ruchy\/przesuniecie/);
  assert.match(hub, /\/ruchy\/wydanie/);
  assert.match(hub, /\/ruchy\/historia/);

  const historyApi = readFileSync(
    join(process.cwd(), "src/app/api/movements/route.ts"),
    "utf8",
  );
  assert.match(historyApi, /listRecentMovements/);

  console.log(
    "prove-scan-movements: ok (roles · paired transfer · negative issue refuse · scan UI seams)",
  );
}

main();
