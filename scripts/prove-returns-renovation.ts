/**
 * Fast F016 gates — no DB: distinct good-return vs renovation gestures,
 * renovation location flag, vendor-issue batch seam, hub wiring, nested-form guard.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  hubGestureHref,
  missingFieldsAfterHubScan,
} from "../src/lib/hub-gesture-fields";
import { gateRole } from "../src/server/gate-role";
import { MOVEMENT_WRITE_ROLES } from "../src/server/movements/roles";

function main() {
  assert.deepEqual(gateRole("magazynier", MOVEMENT_WRITE_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("admin", MOVEMENT_WRITE_ROLES), {
    ok: true,
    role: "admin",
  });
  assert.deepEqual(gateRole("architekt", MOVEMENT_WRITE_ROLES), {
    ok: false,
    status: 403,
  });

  // Distinct hub gestures — not one ambiguous button.
  assert.deepEqual(missingFieldsAfterHubScan("item", "zwrot"), [
    "location",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("item", "renowacja"), [
    "location",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("location", "zwrot"), [
    "item",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("location", "renowacja"), [
    "item",
    "qty",
  ]);

  const zwrotHref = hubGestureHref("zwrot", { kind: "item", id: "item-1" });
  assert.match(zwrotHref, /^\/ruchy\/zwrot\?/);
  assert.match(zwrotHref, /itemId=item-1/);
  assert.match(zwrotHref, /fromHub=1/);

  const renoHref = hubGestureHref("renowacja", {
    kind: "item",
    id: "item-2",
  });
  assert.match(renoHref, /^\/renowacja\/zwrot\?/);
  assert.match(renoHref, /itemId=item-2/);
  assert.notEqual(
    zwrotHref.split("?")[0],
    renoHref.split("?")[0],
    "good return and renovation must open different routes",
  );

  const schema = readFileSync(
    join(process.cwd(), "prisma/schema.prisma"),
    "utf8",
  );
  assert.match(schema, /isRenovation/);
  const migration = readFileSync(
    join(
      process.cwd(),
      "prisma/migrations/20260924240000_location_renovation/migration.sql",
    ),
    "utf8",
  );
  assert.match(migration, /isRenovation/);

  const goodReturn = readFileSync(
    join(process.cwd(), "src/server/movements/post-good-return.ts"),
    "utf8",
  );
  assert.match(goodReturn, /type:\s*"receipt"/);
  assert.match(goodReturn, /isRenovation/);
  assert.match(goodReturn, /not_shelf/);

  const renoReturn = readFileSync(
    join(process.cwd(), "src/server/movements/post-renovation-return.ts"),
    "utf8",
  );
  assert.match(renoReturn, /type:\s*"receipt"/);
  assert.match(renoReturn, /not_renovation/);
  assert.match(renoReturn, /isRenovation/);

  const vendor = readFileSync(
    join(process.cwd(), "src/server/movements/post-vendor-issue-batch.ts"),
    "utf8",
  );
  assert.match(vendor, /type:\s*"issue"/);
  assert.match(vendor, /\$transaction/);
  assert.match(vendor, /createdById/);
  assert.match(vendor, /insufficient_stock/);
  assert.match(vendor, /not_renovation/);

  for (const route of [
    "src/app/api/movements/return/route.ts",
    "src/app/api/movements/renovation-return/route.ts",
    "src/app/api/movements/vendor-issue/route.ts",
  ]) {
    const src = readFileSync(join(process.cwd(), route), "utf8");
    assert.match(src, /MOVEMENT_WRITE_ROLES/);
  }

  const goodUi = readFileSync(
    join(process.cwd(), "src/components/good-return-form.tsx"),
    "utf8",
  );
  assert.match(goodUi, /\/api\/movements\/return/);
  assert.match(goodUi, /Zapisz zwrot na półkę/);
  assert.match(goodUi, /good-return-form/);
  assert.equal(
    (goodUi.match(/<form\b/g) ?? []).length,
    1,
    "GoodReturnForm must be a single flat form",
  );

  const renoUi = readFileSync(
    join(process.cwd(), "src/components/renovation-return-form.tsx"),
    "utf8",
  );
  assert.match(renoUi, /\/api\/movements\/renovation-return/);
  assert.match(renoUi, /Zapisz do renowacji/);
  assert.match(renoUi, /RenovationLocationField/);

  const vendorUi = readFileSync(
    join(process.cwd(), "src/components/vendor-issue-form.tsx"),
    "utf8",
  );
  assert.match(vendorUi, /\/api\/movements\/vendor-issue/);
  assert.match(vendorUi, /Wydaj partię do dostawcy/);
  assert.match(vendorUi, /vendor-issue-lines/);

  const hub = readFileSync(
    join(process.cwd(), "src/components/scan-hub.tsx"),
    "utf8",
  );
  assert.match(hub, /gesture:\s*"zwrot"/);
  assert.match(hub, /gesture:\s*"renowacja"/);
  assert.match(hub, /\/ruchy\/zwrot/);
  assert.match(hub, /title:\s*"Zwrot"/);
  assert.match(hub, /\/renowacja/);
  assert.match(hub, /Do renowacji/);

  const renoPage = readFileSync(
    join(process.cwd(), "src/app/renowacja/page.tsx"),
    "utf8",
  );
  assert.match(renoPage, /renovation-hub-return/);
  assert.match(renoPage, /renovation-hub-vendor-issue/);
  assert.match(renoPage, /\/ruchy\/zwrot/);
  assert.doesNotMatch(renoPage, /Tymczasowo: przenieś/);

  const pkg = readFileSync(join(process.cwd(), "package.json"), "utf8");
  assert.match(pkg, /prove:returns-renovation/);
  assert.match(pkg, /prove:returns-renovation-db/);
  assert.match(
    pkg,
    /prove:returns-renovation && npm run prove:returns-renovation-db/,
  );

  console.log(
    "prove-returns-renovation: ok (distinct gestures · posts · hub · vendor batch)",
  );
}

main();
