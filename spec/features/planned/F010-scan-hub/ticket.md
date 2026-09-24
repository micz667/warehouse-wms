# F010 · Magazynier lands on scan hub and process tiles

## Outcome

A warehouse user opens the hall app and lands on a scan hub with process tiles (Przyjmij / Wydaj / Przenieś / Historia). They can scan a barcode or location without first choosing a procedure; the system asks only for fields still missing. Inwentaryzacja and Renowacja remain reachable as further shortcuts or from the hub.

## Scope

- Default home for `magazynier`: scan hub + process tiles that start hall gestures, not a system menu tree.
- Scan-first path: barcode or location scan before procedure choice; prompt only for missing fields.

## Out of scope

- Reworking receive / issue / transfer posting logic (those stay on later tickets).
- Architect or admin home redesign.

## Acceptance

- Signed-in `magazynier` opens the app on the scan hub with tiles Przyjmij, Wydaj, Przenieś, and Historia visible.
- Scanning an item or location barcode from the hub proceeds without requiring a procedure to be chosen first.
- After a hub scan, the UI asks only for fields still needed to finish the gesture (not a full empty form).
- Inwentaryzacja and Renowacja are reachable from the hub or as further shortcuts without burying them in a settings-style menu.

## Notes

- Hybrid entry: default scan hub + process tiles; procedures stay under the hood.
- Support hall gestures, not classical WMS menu navigation.
