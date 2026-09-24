# Outcome · F012 Shelf transfer and where-is lookup

## Result

A magazynier completes **Przenieś** as a floor gesture (source shelf → item → destination → qty) using the existing paired `transfer` movements, and answers **Gdzie leży?** for one item with each location that holds a positive movement-sum balance. Reachable from the hall hub (tile + post-scan gesture) and from the product card.

## Domain decisions

- Stock remains SUM(movements) only; `listItemLocations` filters to `qty > 0` so zero-balance locations are not listed as holding stock.
- Transfer authz unchanged (magazynier + admin write); locate uses `STOCK_READ_ROLES` like `/stany`.
- No new stock model — reuses `postTransfer` (F007) and movement group sums (F006).

## Acceptance evidence

1. Completing Przenieś decreases source and increases destination by the same qty in one transaction — `npm run prove:transfer-locate-db`.
2. Transfer from a location refuses when available balance would go negative (balances unchanged) — same DB prove.
3. Looking up an item shows each location with positive balance and the qty — same DB prove (`listItemLocations`).
4. Zero-balance locations are not listed as holding stock — same DB prove (drained loc A omitted; never-touched loc C omitted).

`npm run check` on clean candidate `3d9b0f5`:

```
> warehouse-wms@0.1.0 check
> … prove:transfer-locate …
prove-transfer-locate: ok (Przenieś seams · gdzie leży · zero omit · hub/product reach)
> … prove:transfer-locate-db …
prove-transfer-locate-db: ok (paired transfer · refuse negative · locate positive only)
… all prior proves ok …
```

## Key routes / seams

- Transfer UI: `src/components/transfer-form.tsx` (`/ruchy/przesuniecie`) — hall copy Przenieś, available-at-source readout
- Post: existing `postTransfer` / `POST /api/movements/transfer`
- Locate: `src/server/stock/list-item-locations.ts`, `GET /api/stock/item/[id]`, UI `/gdzie` + `LocateItem`
- Hub: `scan-hub.tsx` tile + `gdzie` gesture after item scan; catalog product link
- Prove: `npm run prove:transfer-locate`, `npm run prove:transfer-locate-db` (in `npm run check`)

## Notes

- Out of scope held: cross-warehouse, reservations, cafe issue/signature (F013), storno, labels, returns, inventory session, Symfonia.
