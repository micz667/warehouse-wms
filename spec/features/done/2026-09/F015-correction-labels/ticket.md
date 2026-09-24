# F015 · Wrong-movement correction and label reprint

## Outcome

A warehouse user can correct a wrong movement with a storno / opposite movement that restores balances, and can reprint or reattach a label for an item without recreating the catalog row.

## Scope

- Correction path: post an opposite (storno) movement tied to the mistaken one; balances follow the movement sum.
- Label reprint / reattach from item context (same barcode / Code128 label view as F003).

## Out of scope

- Silent edit or delete of historical movement rows.
- Cafe signature flow changes.

## Acceptance

- Correcting a mistaken movement posts an opposite movement so item/location balances match the intended state.
- The original movement remains visible in history alongside the correction (no silent overwrite).
- From an item, reprint/reattach opens a scannable label for the existing barcode without creating a duplicate catalog item.
- After correction, stock endpoints/UI equal the independent sum of movements for that item/location.

## Notes

- Prefer opposite movement over mutating posted rows — keeps the ledger append-only.
