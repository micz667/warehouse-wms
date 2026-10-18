/**
 * Fast F019 gates — no DB: lock helper, atomic cafe/stocktake claims,
 * seed create-if-missing, magic-byte photo save, uploads auth, check wire.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function main() {
  const root = process.cwd();
  const read = (p: string) => readFileSync(join(root, p), "utf8");

  const lock = read("src/server/stock/lock-stock-keys.ts");
  assert.match(lock, /pg_advisory_xact_lock/);
  assert.match(lock, /lockStockKeys/);

  for (const path of [
    "src/server/movements/post-issue.ts",
    "src/server/movements/post-transfer.ts",
    "src/server/movements/post-correction.ts",
    "src/server/movements/post-vendor-issue-batch.ts",
    "src/server/cafe-issues/sign-cafe-issue.ts",
    "src/server/cafe-issues/emergency-issue-cafe-issue.ts",
  ]) {
    assert.match(read(path), /lockStockKeys/, `${path} must lock stock keys`);
  }

  const sign = read("src/server/cafe-issues/sign-cafe-issue.ts");
  assert.match(sign, /updateMany/);
  assert.match(sign, /status:\s*"prepared"/);
  assert.match(sign, /claimed\.count !== 1/);

  const emergency = read("src/server/cafe-issues/emergency-issue-cafe-issue.ts");
  assert.match(emergency, /updateMany/);
  assert.match(emergency, /claimed\.count !== 1/);

  const approve = read("src/server/stocktake/approve-stocktake-session.ts");
  assert.match(approve, /updateMany/);
  assert.match(approve, /opening_already_done/);
  assert.match(approve, /type:\s*"opening"/);

  const seed = read("prisma/seed.ts");
  assert.match(seed, /SEED_ADMIN_RESET/);
  assert.match(seed, /existing && !reset/);
  assert.doesNotMatch(seed, /\.upsert\(/);

  const photo = read("src/server/catalog/save-catalog-photo.ts");
  assert.match(photo, /detectImageMagic/);
  assert.doesNotMatch(photo, /file\.type/);

  const magic = read("src/server/catalog/detect-image-magic.ts");
  assert.match(magic, /0xff/);
  assert.match(magic, /image\/webp/);

  const uploads = read("src/app/uploads/catalog/[filename]/route.ts");
  assert.match(uploads, /auth\(\)/);
  assert.match(uploads, /401/);

  const middleware = read("src/middleware.ts");
  // Image-extension skip must not blanket-exclude /uploads paths.
  assert.doesNotMatch(
    middleware,
    /\.\*\\\\?\.\(\?:svg\|png\|jpg/,
  );

  const pkg = read("package.json");
  assert.match(pkg, /prove:stock-concurrency-db/);
  assert.match(pkg, /prove:cafe-double-post-db/);
  assert.match(pkg, /prove:opening-stocktake-once-db/);
  assert.match(pkg, /prove:hardening/);
  assert.match(pkg, /"check".*prove:hardening/);
  assert.match(pkg, /"check".*prove:stock-concurrency-db/);
  assert.match(pkg, /"next":\s*"\^?16\.(?:4\.[1-9]\d*|[5-9]\.\d+|[1-9]\d+\.\d+)"/);

  const envExample = read(".env.example");
  assert.match(envExample, /SEED_ADMIN_RESET/);

  console.log(
    "prove-hardening: ok (locks · atomic claims · seed · magic bytes · uploads auth · check wire)",
  );
}

main();
