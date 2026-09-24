# Outcome · F017 Inventory session with variances

## Result

Beyond opening stocktake, users run an **inwentaryzacja** session against an already populated catalog and movement-sum stock: count on the floor, see variance (counted − system) per line, and approve so correcting movements bring balances in line. Re-approve is blocked.

## Domain decisions

- Extends `StocktakeSession` with `kind`: `opening` (F005) | `inventory` (F017). Default `opening` keeps prior sessions and proves intact.
- Inventory approve posts `correction` movements with qty = counted − SUM(movements); zero-variance lines skip a movement. Stock remains SUM(movements) only — never a raw qty column.
- Inventory corrections do not set `correctsMovementId` (distinct from F015 storno of a mistaken row).
- Magazynier + admin write (same `STOCKTAKE_WRITE_ROLES`).

## Acceptance evidence

1. Starting an inventory session lets users count qty per item × location against a populated catalog — `npm run prove:inventory-session-db` (receipt-seeded stock, then inventory lines).
2. Before approve, the session shows variance (counted vs system stock) per counted line — same DB prove (`getStocktakeSession` systemQty/variance) and hall UI (`Odchylenie` on `/spis/[id]`).
3. Approving posts correcting movements so post-approve balances equal counted qtys — same DB prove (system 10 → count 7 → balance 7; flat line unchanged).
4. Re-approving an approved session is blocked — same prove (`already_approved`; movement count unchanged).

`npm run check` on clean candidate `09e485d`:

```
> warehouse-wms@0.1.0 check
> … prove:inventory-session …
prove-inventory-session: ok (kind · variance approve · UI · hub · check wire)
> … prove:inventory-session-db …
prove-inventory-session-db: ok (variance shown · correction posts · re-approve blocked · opening intact)
> … prove:stocktake-db …
prove-stocktake-db: ok (opening movements = counted qty, re-approve/edit blocked, stock sum)
… all prior proves ok …
```

## Key routes / seams

- UI: `/spis` (Nowa inwentaryzacja / Spis otwarcia), `/spis/[id]` (variance before approve)
- API: `POST /api/stocktakes` with `{ kind: "inventory" }`; same start / lines / approve as F005
- Domain: `approveStocktakeSession` branches on `kind`; `getStocktakeSession` enriches inventory lines with systemQty/variance
- Hub shortcut: Inwentaryzacja → `/spis`
- Prove: `npm run prove:inventory-session`, `npm run prove:inventory-session-db` (in `npm run check`)

## Notes

- Out of scope held: blind multi-team count, cycle-count scheduling, Symfonia, F018 emergency issue.
- Next: F018 · Emergency issue without signature.
