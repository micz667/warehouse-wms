# Outcome · F014 Movement history on the product card

## Result

From a product card or hub item scan, a hall/warehouse user opens **Historia** and sees that SKU’s movements newest-first (type, qty, location, actor, timestamp) without the admin audit screen.

## Domain decisions

- Single Movement ledger unchanged; product history is `listRecentMovements({ catalogItemId })`.
- Solo `catalogItemId` on `GET /api/movements` uses `MOVEMENT_READ_ROLES` (magazynier + architekt + admin). Date / location / actor filters still require `MOVEMENT_AUDIT_ROLES` (F009).
- Hub tile stays general `/ruchy/historia`; post-scan **Historia** gesture and product-card link deep-link with `?catalogItemId=`.

## Acceptance evidence

1. Opening Historia on a product card lists that item’s movements newest-first with type, qty, location(s), actor, timestamp — `npm run prove:product-history` (UI/API seams) + `npm run prove:product-history-db` (ordered rows with actor/time/location).
2. Movements from receipt, transfer, issue, and opening stocktake for that item all appear when present — same DB prove (types + both transfer legs; other SKUs excluded).
3. Reachable from hall Historia tile or product card without admin role — hub tile `/ruchy/historia`, hub gesture + `catalog-history-link`; historia page has no `MOVEMENT_AUDIT_ROLES` gate; product-only API filter is read-role.

`npm run check` on clean candidate `a64c3be` (working tree clean):

```
prove-product-history: ok (product filter read · hub/card reach · list seams)
prove-product-history-db: ok (opening/receipt/transfer/issue · newest-first · SKU filter)
… full native lane green (lint · typecheck · prisma validate · all prior proves) …
```

## Key routes / seams

- Auth: `src/server/movements/movement-list-requires-audit.ts` + `GET /api/movements`
- UI: `MovementHistoryList` (`initialCatalogItemId`), `/ruchy/historia?catalogItemId=`, catalog **Historia** link, hub `historia` gesture
- Prove: `npm run prove:product-history`, `npm run prove:product-history-db` (in `npm run check`)

## Notes

- Out of scope held: admin global audit (F009), wrong-movement correction (F015), Symfonia, F016–F018.
- Next: F015 · Wrong-movement correction and label reprint.
