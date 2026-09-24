/**
 * Fast F010 gates — no DB: magazynier lands on scan hub; tiles + scan-first
 * routing; missing-field contract after hub scan; shortcuts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  hubGestureHref,
  missingFieldsAfterHubScan,
} from "../src/lib/hub-gesture-fields";

function main() {
  // Acceptance: after hub scan, UI asks only for still-needed fields.
  assert.deepEqual(missingFieldsAfterHubScan("item", "przyjmij"), [
    "location",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("location", "przyjmij"), [
    "item",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("item", "wydaj"), [
    "location",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("location", "wydaj"), [
    "item",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("item", "przenies"), [
    "fromLocation",
    "toLocation",
    "qty",
  ]);
  assert.deepEqual(missingFieldsAfterHubScan("location", "przenies"), [
    "item",
    "toLocation",
    "qty",
  ]);

  // Known scan identity is never in the missing list (not a full empty form).
  for (const gesture of ["przyjmij", "wydaj", "przenies"] as const) {
    assert.ok(
      !missingFieldsAfterHubScan("item", gesture).includes("item"),
      `item scan must not re-ask item for ${gesture}`,
    );
  }
  assert.ok(
    !missingFieldsAfterHubScan("location", "przyjmij").includes("location"),
  );
  assert.ok(
    !missingFieldsAfterHubScan("location", "wydaj").includes("location"),
  );
  assert.ok(
    !missingFieldsAfterHubScan("location", "przenies").includes("fromLocation"),
  );

  const itemHref = hubGestureHref("przyjmij", {
    kind: "item",
    id: "item-1",
  });
  assert.match(itemHref, /^\/ruchy\/przyjecie\?/);
  assert.match(itemHref, /itemId=item-1/);
  assert.match(itemHref, /fromHub=1/);
  assert.doesNotMatch(itemHref, /locationId=/);

  const locHref = hubGestureHref("wydaj", {
    kind: "location",
    id: "loc-1",
  });
  assert.match(locHref, /^\/ruchy\/wydanie\?/);
  assert.match(locHref, /locationId=loc-1/);
  assert.match(locHref, /fromHub=1/);

  const transferLoc = hubGestureHref("przenies", {
    kind: "location",
    id: "loc-2",
  });
  assert.match(transferLoc, /fromLocationId=loc-2/);
  assert.doesNotMatch(transferLoc, /(?:^|[?&])locationId=/);

  const home = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
  assert.match(home, /role === "magazynier"/);
  assert.match(home, /ScanHub/);
  assert.match(home, /AppHeader title="Hala"/);

  const hub = readFileSync(
    join(process.cwd(), "src/components/scan-hub.tsx"),
    "utf8",
  );
  assert.match(hub, /Przyjmij/);
  assert.match(hub, /Wydaj/);
  assert.match(hub, /Przenieś/);
  assert.match(hub, /Historia/);
  assert.match(hub, /\/ruchy\/przyjecie/);
  assert.match(hub, /\/ruchy\/wydanie/);
  assert.match(hub, /\/ruchy\/przesuniecie/);
  assert.match(hub, /\/ruchy\/historia/);
  assert.match(hub, /Inwentaryzacja/);
  assert.match(hub, /\/spis/);
  assert.match(hub, /Renowacja/);
  assert.match(hub, /\/renowacja/);
  // Scan-first: resolve without choosing a procedure first.
  assert.match(hub, /\/api\/catalog\/by-barcode\//);
  assert.match(hub, /\/api\/locations\/by-code\//);
  assert.match(hub, /hub-scan-input/);
  assert.match(hub, /BarcodeScanner/);
  assert.match(hub, /hubGestureHref/);

  const renowacja = readFileSync(
    join(process.cwd(), "src/app/renowacja/page.tsx"),
    "utf8",
  );
  assert.match(renowacja, /Renowacja/);
  assert.match(renowacja, /F016/);

  const receipt = readFileSync(
    join(process.cwd(), "src/components/receipt-form.tsx"),
    "utf8",
  );
  assert.match(receipt, /fromHub/);
  assert.match(receipt, /initialItem/);
  assert.match(receipt, /Dokończ przyjęcie/);

  console.log(
    "prove-scan-hub: ok (magazynier hub · tiles · scan-first · missing fields · shortcuts)",
  );
}

main();
