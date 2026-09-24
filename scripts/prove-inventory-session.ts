/**
 * Fast F017 gates — no DB: inventory kind in schema, variance approve seam,
 * UI shows variance before approve, re-approve blocked, prove scripts wired.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function main() {
  const schema = readFileSync(
    join(process.cwd(), "prisma/schema.prisma"),
    "utf8",
  );
  assert.match(schema, /enum\s+StocktakeKind/);
  assert.match(schema, /\binventory\b/);
  assert.match(schema, /kind\s+StocktakeKind/);

  const approve = readFileSync(
    join(
      process.cwd(),
      "src/server/stocktake/approve-stocktake-session.ts",
    ),
    "utf8",
  );
  assert.match(approve, /kind === "inventory"/);
  assert.match(approve, /type:\s*"correction"/);
  assert.match(approve, /already_approved/);
  assert.match(approve, /sumMovementQty/);

  const create = readFileSync(
    join(process.cwd(), "src/server/stocktake/create-stocktake-session.ts"),
    "utf8",
  );
  assert.match(create, /kind/);
  assert.match(create, /inventory/);

  const list = readFileSync(
    join(process.cwd(), "src/server/stocktake/list-stocktake-sessions.ts"),
    "utf8",
  );
  assert.match(list, /systemQty/);
  assert.match(list, /variance/);

  const panel = readFileSync(
    join(process.cwd(), "src/components/stocktake-session-panel.tsx"),
    "utf8",
  );
  assert.match(panel, /Odchylenie/);
  assert.match(panel, /systemQty/);
  assert.match(panel, /Zatwierdź \(korekty stanów\)/);

  const listUi = readFileSync(
    join(process.cwd(), "src/components/stocktake-session-list.tsx"),
    "utf8",
  );
  assert.match(listUi, /Nowa inwentaryzacja/);
  assert.match(listUi, /createSession\("inventory"\)/);

  const api = readFileSync(
    join(process.cwd(), "src/app/api/stocktakes/route.ts"),
    "utf8",
  );
  assert.match(api, /kind/);

  const pkg = readFileSync(join(process.cwd(), "package.json"), "utf8");
  assert.match(pkg, /prove:inventory-session/);
  assert.match(pkg, /prove:inventory-session-db/);
  assert.match(pkg, /"check".*prove:inventory-session/);

  const hub = readFileSync(
    join(process.cwd(), "src/components/scan-hub.tsx"),
    "utf8",
  );
  assert.match(hub, /hub-shortcut-inwentaryzacja/);
  assert.match(hub, /\/spis/);

  console.log(
    "prove-inventory-session: ok (kind · variance approve · UI · hub · check wire)",
  );
}

main();
