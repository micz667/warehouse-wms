/**
 * Fast F015 gates — no DB: correction storno seam, authz, history UI hang,
 * label reprint from product card (same Code128 path, no catalog recreate).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

  const schema = readFileSync(
    join(process.cwd(), "prisma/schema.prisma"),
    "utf8",
  );
  assert.match(schema, /correction/);
  assert.match(schema, /correctsMovementId/);
  assert.match(
    schema,
    /correctsMovement\s+Movement\?\s+@relation\("MovementCorrection",\s*fields:\s*\[correctsMovementId\]/,
  );
  const migration = readFileSync(
    join(
      process.cwd(),
      "prisma/migrations/20260924233000_movement_correction/migration.sql",
    ),
    "utf8",
  );
  assert.match(migration, /ON DELETE SET NULL/);
  assert.doesNotMatch(
    migration,
    /correctsMovementId[\s\S]*ON DELETE CASCADE/,
    "correcting FK must not cascade-delete the original",
  );

  const post = readFileSync(
    join(process.cwd(), "src/server/movements/post-correction.ts"),
    "utf8",
  );
  assert.match(post, /type:\s*"correction"/);
  assert.match(post, /correctsMovementId:\s*original\.id/);
  assert.match(post, /original\.qty\.neg\(\)/);
  assert.match(post, /already_corrected/);
  assert.doesNotMatch(post, /\.delete\(/);
  assert.doesNotMatch(post, /\.update\([\s\S]*qty/);

  const route = readFileSync(
    join(process.cwd(), "src/app/api/movements/correct/route.ts"),
    "utf8",
  );
  assert.match(route, /MOVEMENT_WRITE_ROLES/);
  assert.match(route, /postCorrection/);
  assert.match(route, /movementId/);

  const historyUi = readFileSync(
    join(process.cwd(), "src/components/movement-history-list.tsx"),
    "utf8",
  );
  assert.match(historyUi, /Popraw ten ruch/);
  assert.match(historyUi, /\/api\/movements\/correct/);
  assert.match(
    historyUi,
    /type="button"[\s\S]*?data-testid="correct-movement"/,
  );
  assert.match(historyUi, /correction:\s*"Korekta"/);
  // Correct hangs on the list row, not inside the admin filter <form>.
  const formEnd = historyUi.lastIndexOf("</form>");
  const correctIdx = historyUi.indexOf('data-testid="correct-movement"');
  assert.ok(formEnd >= 0 && correctIdx > formEnd, "Popraw must sit outside filter form");

  const catalogUi = readFileSync(
    join(process.cwd(), "src/components/catalog-edit-form.tsx"),
    "utf8",
  );
  assert.match(catalogUi, /data-testid="catalog-reprint-label"/);
  assert.match(catalogUi, /\/katalog\/\$\{item\.id\}\/etykieta/);
  assert.doesNotMatch(
    catalogUi,
    /\/api\/catalog(?!\/)/,
    "reprint link must not POST a new catalog item",
  );

  const labelPage = readFileSync(
    join(process.cwd(), "src/app/katalog/[id]/etykieta/page.tsx"),
    "utf8",
  );
  assert.match(labelPage, /BarcodeLabel/);
  assert.match(labelPage, /item\.barcode/);
  assert.match(labelPage, /data-testid="catalog-label-barcode"/);
  assert.doesNotMatch(labelPage, /createCatalogItem|generateBarcode/);

  const pkg = readFileSync(join(process.cwd(), "package.json"), "utf8");
  assert.match(pkg, /prove:correction/);
  assert.match(pkg, /prove:correction-db/);

  console.log(
    "prove-correction: ok (storno seam · write roles · history Popraw · label reprint)",
  );
}

main();
