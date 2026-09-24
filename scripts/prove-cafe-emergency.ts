/**
 * Fast F018 gates — no DB: roles, emergency domain + API seams,
 * conscious confirm UI, receipt metadata, signed path still default.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gateRole } from "../src/server/gate-role";
import {
  CAFE_ISSUE_READ_ROLES,
  CAFE_ISSUE_WRITE_ROLES,
} from "../src/server/cafe-issues/roles";

function main() {
  assert.deepEqual(gateRole("magazynier", CAFE_ISSUE_WRITE_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("admin", CAFE_ISSUE_WRITE_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("architekt", CAFE_ISSUE_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("magazynier", CAFE_ISSUE_READ_ROLES), {
    ok: true,
    role: "magazynier",
  });

  const emergency = readFileSync(
    join(process.cwd(), "src/server/cafe-issues/emergency-issue-cafe-issue.ts"),
    "utf8",
  );
  assert.match(emergency, /confirmed !== true/);
  assert.match(emergency, /signatureSkipped:\s*true/);
  assert.match(emergency, /status:\s*"received"/);
  assert.match(emergency, /type:\s*"issue"/);
  assert.match(emergency, /doc\.status !== "prepared"/);
  assert.match(emergency, /sumMovementQty/);
  assert.match(emergency, /emergencyNote/);
  assert.match(emergency, /\$transaction/);

  const sign = readFileSync(
    join(process.cwd(), "src/server/cafe-issues/sign-cafe-issue.ts"),
    "utf8",
  );
  assert.match(sign, /signatureData/);
  assert.match(sign, /status:\s*"received"/);
  assert.doesNotMatch(
    sign,
    /signatureSkipped/,
    "signed path must remain the default F013b flow without emergency flag",
  );

  const api = readFileSync(
    join(
      process.cwd(),
      "src/app/api/cafe-issues/[id]/emergency-issue/route.ts",
    ),
    "utf8",
  );
  assert.match(api, /emergencyIssueCafeIssue/);
  assert.match(api, /CAFE_ISSUE_WRITE_ROLES/);
  assert.match(api, /confirmed/);
  assert.match(api, /emergencyNote/);

  const ui = readFileSync(
    join(process.cwd(), "src/components/cafe-emergency-issue.tsx"),
    "utf8",
  );
  assert.match(ui, /cafe-emergency-issue/);
  assert.match(ui, /cafe-emergency-open/);
  assert.match(ui, /cafe-emergency-confirm/);
  assert.match(ui, /cafe-emergency-submit/);
  assert.match(ui, /Wydaj bez podpisu/);
  assert.match(ui, /\/emergency-issue/);
  assert.match(ui, /confirmed:\s*true/);
  assert.doesNotMatch(ui, /<form\b/);

  const detail = readFileSync(
    join(process.cwd(), "src/app/ruchy/wydanie/[id]/page.tsx"),
    "utf8",
  );
  assert.match(detail, /CafeSignaturePad/);
  assert.match(detail, /CafeEmergencyIssue/);
  assert.match(detail, /cafe-emergency-receipt/);
  assert.match(detail, /cafe-emergency-by/);
  assert.match(detail, /cafe-emergency-at/);
  assert.match(detail, /cafe-emergency-reason/);
  assert.match(detail, /cafe-signature-receipt/);

  const labels = readFileSync(
    join(process.cwd(), "src/lib/cafe-issue-labels.ts"),
    "utf8",
  );
  assert.match(labels, /signatureSkipped/);
  assert.match(labels, /bez podpisu/);

  console.log(
    "prove-cafe-emergency: ok (roles · confirm+note · posts issue · UI/API · signed path intact)",
  );
}

main();
