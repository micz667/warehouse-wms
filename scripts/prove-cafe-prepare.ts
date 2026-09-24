/**
 * Fast F013a gates — no DB: roles, prepare seams (no Movement), hall UX,
 * list/reopen paths, nested-form guard, hub Wydaj → cafe prepare.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  hubGestureHref,
  missingFieldsAfterHubScan,
} from "../src/lib/hub-gesture-fields";
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
  assert.deepEqual(gateRole("architekt", CAFE_ISSUE_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("magazynier", CAFE_ISSUE_READ_ROLES), {
    ok: true,
    role: "magazynier",
  });

  // Hub Wydaj now collects cafe destination for prepare.
  assert.deepEqual(missingFieldsAfterHubScan("item", "wydaj"), [
    "location",
    "cafe",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("location", "wydaj"), [
    "item",
    "cafe",
    "qty",
  ]);

  const wydajHref = hubGestureHref("wydaj", {
    kind: "item",
    id: "item-c",
  });
  assert.match(wydajHref, /^\/ruchy\/wydanie\?/);
  assert.match(wydajHref, /itemId=item-c/);
  assert.match(wydajHref, /fromHub=1/);

  const prepare = readFileSync(
    join(process.cwd(), "src/server/cafe-issues/prepare-cafe-issue.ts"),
    "utf8",
  );
  assert.match(prepare, /status:\s*"prepared"/);
  assert.match(prepare, /cafeIssue\.create/);
  assert.doesNotMatch(
    prepare,
    /movement\.create|postIssue|type:\s*"issue"/,
    "prepare must not post issue movements",
  );

  const ui = readFileSync(
    join(process.cwd(), "src/components/cafe-prepare-form.tsx"),
    "utf8",
  );
  assert.match(ui, /\/api\/cafe-issues/);
  assert.match(ui, /Przygotuj paczkę/);
  assert.match(ui, /Kawiarnia \(cel\)/);
  assert.match(ui, /cafe-prepare-form/);
  assert.match(ui, /cafe-prepared-list/);
  assert.doesNotMatch(
    ui,
    /\/api\/movements\/issue/,
    "hall prepare path must not call immediate issue API",
  );
  // Outer form only — ItemScanField / LocationField must stay form-free.
  assert.match(ui, /<form\b/);
  assert.match(ui, /ItemScanField/);
  assert.match(ui, /LocationField/);

  const itemScan = readFileSync(
    join(process.cwd(), "src/components/item-scan-field.tsx"),
    "utf8",
  );
  assert.doesNotMatch(itemScan, /<form\b/);

  const locationField = readFileSync(
    join(process.cwd(), "src/components/location-field.tsx"),
    "utf8",
  );
  assert.doesNotMatch(locationField, /<form\b/);

  const detail = readFileSync(
    join(process.cwd(), "src/app/ruchy/wydanie/[id]/page.tsx"),
    "utf8",
  );
  assert.match(detail, /cafe-issue-detail/);
  assert.match(detail, /getCafeIssue/);
  assert.doesNotMatch(detail, /postIssue|\/api\/movements\/issue/);

  const hub = readFileSync(
    join(process.cwd(), "src/components/scan-hub.tsx"),
    "utf8",
  );
  assert.match(hub, /Paczka do kawiarni/);
  assert.match(hub, /\/ruchy\/wydanie/);

  const page = readFileSync(
    join(process.cwd(), "src/app/ruchy/wydanie/page.tsx"),
    "utf8",
  );
  assert.match(page, /CafePrepareForm/);
  assert.doesNotMatch(page, /IssueForm/);

  console.log(
    "prove-cafe-prepare: ok (roles · prepare no Movement · hall seams · list/reopen · no nested form)",
  );
}

main();
