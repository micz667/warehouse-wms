/**
 * Fast F013b gates — no DB: roles, sign seams (posts issue only after sign),
 * detail pad / receipt UI, API route, prepared-only guard in domain.
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

  const sign = readFileSync(
    join(process.cwd(), "src/server/cafe-issues/sign-cafe-issue.ts"),
    "utf8",
  );
  assert.match(sign, /status:\s*"received"/);
  assert.match(sign, /type:\s*"issue"/);
  assert.match(sign, /doc\.status !== "prepared"/);
  assert.match(sign, /sumMovementQty/);
  assert.match(sign, /signatureData/);
  assert.match(sign, /\$transaction/);

  const prepare = readFileSync(
    join(process.cwd(), "src/server/cafe-issues/prepare-cafe-issue.ts"),
    "utf8",
  );
  assert.doesNotMatch(
    prepare,
    /movement\.create|postIssue|type:\s*"issue"/,
    "prepare must still not post issue movements",
  );

  const api = readFileSync(
    join(process.cwd(), "src/app/api/cafe-issues/[id]/sign/route.ts"),
    "utf8",
  );
  assert.match(api, /signCafeIssue/);
  assert.match(api, /CAFE_ISSUE_WRITE_ROLES/);
  assert.match(api, /signatureData/);

  const pad = readFileSync(
    join(process.cwd(), "src/components/cafe-signature-pad.tsx"),
    "utf8",
  );
  assert.match(pad, /cafe-signature-pad/);
  assert.match(pad, /Podpisz odbiór/);
  assert.match(pad, /\/api\/cafe-issues\/\$\{/);
  assert.match(pad, /\/sign/);
  assert.doesNotMatch(pad, /<form\b/);
  assert.doesNotMatch(
    pad,
    /\/api\/movements\/issue/,
    "signature path must not call immediate issue API",
  );

  const detail = readFileSync(
    join(process.cwd(), "src/app/ruchy/wydanie/[id]/page.tsx"),
    "utf8",
  );
  assert.match(detail, /CafeSignaturePad/);
  assert.match(detail, /cafe-signature-receipt/);
  assert.match(detail, /cafe-signed-by/);
  assert.match(detail, /cafe-signed-at/);
  assert.doesNotMatch(detail, /\/api\/movements\/issue/);

  const labels = readFileSync(
    join(process.cwd(), "src/lib/cafe-issue-labels.ts"),
    "utf8",
  );
  assert.match(labels, /received:/);
  assert.match(labels, /Odebrane/);

  console.log(
    "prove-cafe-signature: ok (roles · sign posts issue · pad/API · prepared-only · no nested form)",
  );
}

main();
