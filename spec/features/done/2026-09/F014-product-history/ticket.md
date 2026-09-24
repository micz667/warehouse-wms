# F014 · Movement history on the product card

## Outcome

From a product card, a hall or warehouse user sees that item’s movement history (what moved, where, when, by whom) without opening the admin audit screen.

## Scope

- Historia entry from product context / Historia tile deep into one item’s movements.
- Chronological list of movements for that SKU with location, qty, type, actor, time.

## Out of scope

- Admin global filtered audit (already F009).
- Editing or reversing movements (F015).

## Acceptance

- Opening Historia on a product card lists that item’s movements newest-first with type, qty, location(s), actor, and timestamp.
- Movements from receipt, transfer, issue, and opening stocktake for that item all appear when present.
- The list is reachable from the hall Historia tile or product card without requiring the admin role.

## Notes

- F009 already covers admin filters across the ledger; this ticket is product-centric hall history, not a second admin filter UI.
