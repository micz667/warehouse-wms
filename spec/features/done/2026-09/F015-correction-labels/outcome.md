# Outcome · F015 Wrong-movement correction and label reprint

## Result

A magazynier (or admin) can storno a mistaken movement with an opposite row so balances return to the intended state, and can reprint the existing Code128 label from the product card without creating a duplicate catalog item. The original movement stays in history next to the correction.

## Domain decisions

- Append-only: `postCorrection` creates `type: correction` with `qty = −original.qty` and `correctsMovementId`; never updates or deletes the mistaken row.
- One storno per original (`correctsMovementId` unique); correcting a correction is refused.
- Negative opposites refuse when the location would go below zero (same hall rule as issue).
- Label reprint reuses `/katalog/[id]/etykieta` and the existing barcode (F003).

## Acceptance evidence

1. Correcting a mistaken movement posts an opposite so balances match intended state — `npm run prove:correction-db` (receipt +7 → storno −7 → balance 0; issue undo restores +5).
2. Original remains visible alongside correction — same DB prove (`findUnique` + `listRecentMovements` lists both; `hasCorrection` / `correctsMovementId`).
3. From an item, reprint opens the existing barcode label without a duplicate catalog row — `prove:correction` (card link → etykieta + `BarcodeLabel`) and DB prove (catalog count stays 1 for that barcode).
4. After correction, stock equals independent `SUM(qty)` — `prove:correction-db` (`independentSum` vs `sumMovementQty`).

`npm run check` evidence recorded at the clean candidate commit in this PR.

## Key routes / seams

- Lib: `src/server/movements/post-correction.ts`
- API: `POST /api/movements/correct` (`MOVEMENT_WRITE_ROLES`)
- UI: **Popraw ten ruch** on `MovementHistoryList`; **Etykieta / przedruk** on product card
- Schema: `MovementType.correction`, `correctsMovementId`
- Prove: `npm run prove:correction`, `npm run prove:correction-db` (wired into `npm run check`)

## Notes

- Out of scope held: silent edit/delete of history, cafe signature changes, Symfonia, F016–F018.
- Next: F016 · Good return and return-to-renovation.
