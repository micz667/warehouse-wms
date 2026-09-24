/**
 * Fast F012 gates — no DB: Przenieś hall seams, where-is lookup seams,
 * zero-balance omit contract, hub + product reachability, nested-form guard.
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
  MOVEMENT_WRITE_ROLES,
} from "../src/server/movements/roles";
import { STOCK_READ_ROLES } from "../src/server/stocktake/roles";

function main() {
  // Magazynier can write transfers (same F007 authz).
  assert.deepEqual(gateRole("magazynier", MOVEMENT_WRITE_ROLES), {
    ok: true,
    role: "magazynier",
  });
  assert.deepEqual(gateRole("architekt", MOVEMENT_WRITE_ROLES), {
    ok: false,
    status: 403,
  });
  assert.deepEqual(gateRole("magazynier", STOCK_READ_ROLES), {
    ok: true,
    role: "magazynier",
  });

  // Hub: Gdzie leży after item scan needs nothing else.
  assert.deepEqual(missingFieldsAfterHubScan("item", "gdzie"), []);
  assert.deepEqual(missingFieldsAfterHubScan("location", "gdzie"), ["item"]);

  const gdzieHref = hubGestureHref("gdzie", { kind: "item", id: "item-9" });
  assert.equal(gdzieHref, "/gdzie?itemId=item-9");

  const transfer = readFileSync(
    join(process.cwd(), "src/server/movements/post-transfer.ts"),
    "utf8",
  );
  assert.match(transfer, /insufficient_stock/);
  assert.match(transfer, /qty:\s*parsed\.qty\.neg\(\)/);
  assert.match(transfer, /\$transaction/);

  const locate = readFileSync(
    join(process.cwd(), "src/server/stock/list-item-locations.ts"),
    "utf8",
  );
  assert.match(locate, /sum\.gt\(0\)/, "locate omits zero-balance locations");
  assert.match(locate, /groupBy/);

  const locateUi = readFileSync(
    join(process.cwd(), "src/components/locate-item.tsx"),
    "utf8",
  );
  assert.match(locateUi, /Gdzie leży\?/);
  assert.match(locateUi, /\/api\/stock\/item\//);
  assert.match(locateUi, /data-testid="locate-results"/);
  assert.match(locateUi, /ItemScanField/);
  assert.doesNotMatch(
    locateUi,
    /<form\b/,
    "LocateItem must not wrap ItemScanField in a nested form",
  );

  const transferUi = readFileSync(
    join(process.cwd(), "src/components/transfer-form.tsx"),
    "utf8",
  );
  assert.match(transferUi, /Przenieś/);
  assert.match(transferUi, /Półka źródłowa/);
  assert.match(transferUi, /Półka docelowa/);
  assert.match(transferUi, /\/api\/movements\/transfer/);
  assert.match(transferUi, /transfer-available/);
  assert.match(transferUi, /Z półki na półkę/);

  const hub = readFileSync(
    join(process.cwd(), "src/components/scan-hub.tsx"),
    "utf8",
  );
  assert.match(hub, /Przenieś/);
  assert.match(hub, /Gdzie leży\?/);
  assert.match(hub, /\/gdzie/);
  assert.match(hub, /\/ruchy\/przesuniecie/);
  assert.match(hub, /gesture:\s*"gdzie"/);
  assert.match(hub, /hub-gesture-\$\{choice\.gesture\}/);

  const catalog = readFileSync(
    join(process.cwd(), "src/components/catalog-edit-form.tsx"),
    "utf8",
  );
  assert.match(catalog, /\/gdzie\?itemId=/);
  assert.match(catalog, /catalog-locate-link/);

  const api = readFileSync(
    join(process.cwd(), "src/app/api/stock/item/[id]/route.ts"),
    "utf8",
  );
  assert.match(api, /listItemLocations/);
  assert.match(api, /STOCK_READ_ROLES/);

  const page = readFileSync(
    join(process.cwd(), "src/app/gdzie/page.tsx"),
    "utf8",
  );
  assert.match(page, /LocateItem/);
  assert.match(page, /itemId/);

  console.log(
    "prove-transfer-locate: ok (Przenieś seams · gdzie leży · zero omit · hub/product reach)",
  );
}

main();
