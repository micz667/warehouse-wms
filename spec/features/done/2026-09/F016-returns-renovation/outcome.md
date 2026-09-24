# Outcome · F016 Good return and return-to-renovation

## Result

Returned goods take two distinct hall paths: **Zwrot** puts good stock back on a shelf via a receipt movement; **Do renowacji** parks damaged or dirty returns at a renovation-section location (`Location.isRenovation`). A later **Wydanie do dostawcy** batch issues from that section, decreasing renovation balances with actor and time on each movement.

## Domain decisions

- Renovation is a Location flag, not a parallel stock ledger — stock remains SUM(movements) only.
- Good return refuses renovation destinations; renovation return and vendor issue refuse non-renovation locations.
- No new MovementType — returns use `receipt`, vendor leave uses `issue` (same as cafe sign leave).
- Magazynier + admin write (`MOVEMENT_WRITE_ROLES`).

## Acceptance evidence

1. Completing a good return increases the chosen shelf location by the returned qty via movements — `npm run prove:returns-renovation-db`.
2. Routing a return to renovation places stock at the renovation section location (visible in where-is / balances) — same DB prove (`listItemLocations`).
3. Batch vendor issue from renovation decreases renovation-section stock by the issued qtys and records actor + time — same DB prove.
4. Good-return and renovation paths are distinct gestures (Zwrot tile/gesture vs Do renowacji / Renowacja hub) — `npm run prove:returns-renovation`.

`npm run check` on clean candidate `9c55068`:

```
> warehouse-wms@0.1.0 check
> … prove:returns-renovation …
prove-returns-renovation: ok (distinct gestures · posts · hub · vendor batch)
> … prove:returns-renovation-db …
prove-returns-renovation-db: ok (good return · reno park · vendor batch · actor)
… all prior proves ok …
```

## Key routes / seams

- Good return: `postGoodReturn` → `POST /api/movements/return` → `/ruchy/zwrot` (`GoodReturnForm`)
- Renovation return: `postRenovationReturn` → `POST /api/movements/renovation-return` → `/renowacja/zwrot`
- Vendor batch: `postVendorIssueBatch` → `POST /api/movements/vendor-issue` → `/renowacja/wydanie`
- Hub: Zwrot tile + `zwrot` / `renowacja` post-scan gestures; Renowacja shortcut → real hub
- Admin: `isRenovation` on location create/edit; `GET /api/locations?renovation=1`
- Prove: `npm run prove:returns-renovation`, `npm run prove:returns-renovation-db` (in `npm run check`)

## Notes

- Out of scope held: full vendor RMA / Symfonia purchase credit; cafe prepare/signature (F013a/b); Symfonia mapping; F017–F018.
- Next: F017 · Inventory session with variances.
