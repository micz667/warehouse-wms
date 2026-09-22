# Outcome · F006 Stock from movements

## Result

Anywhere stock is shown, quantity equals the sum of movements for that item × location (or item total). `sumMovementQty` is the single server sum path; `GET /api/stock` and `/stany` use `listStockBalances` / `getStockBalance` built on it. Schema has no `ItemLocation` and no writable on-hand qty on Location/CatalogItem; `/stany` has no qty input. Movement kinds `receipt` / `issue` / `transfer` exist for signed deltas (F007 UI later).

## Acceptance evidence

1. After opening + known receipt/issue/transfer set, displayed qty matches an independent SQL `SUM(qty)` — `npm run prove:stock-from-movements-db` (loc A = 10, loc B = 2, item total = 12).
2. No admin UI to type a raw on-hand qty — schema + `/stany` read-only audit in `prove:stock-from-movements` and the DB prove.
3. `npm run check` includes `prove:stock-from-movements` and `prove:stock-from-movements-db`.

`npm run check` on clean candidate `5fece1d` (implementation `d0a8da4` + board/outcome):

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role && npm run prove:catalog && npm run prove:locations && npm run prove:stocktake && npm run prove:stocktake-db && npm run prove:stock-from-movements && npm run prove:stock-from-movements-db

> warehouse-wms@0.1.0 lint
> eslint

> warehouse-wms@0.1.0 typecheck
> tsc --noEmit

> warehouse-wms@0.1.0 prisma:validate
> prisma validate
The schema at prisma/schema.prisma is valid 🚀

> warehouse-wms@0.1.0 prove:gate-role
> tsx scripts/prove-gate-role.ts
prove-gate-role: ok

> warehouse-wms@0.1.0 prove:catalog
> tsx scripts/prove-catalog.ts
prove-catalog: ok (Code128 value shape + write/read gates)

> warehouse-wms@0.1.0 prove:locations
> tsx scripts/prove-locations.ts
prove-locations: ok (code normalize + admin write / hall read gates)

> warehouse-wms@0.1.0 prove:stocktake
> tsx scripts/prove-stocktake.ts
prove-stocktake: ok (magazynier/admin write · all roles read)

> warehouse-wms@0.1.0 prove:stocktake-db
> tsx scripts/prove-stocktake-db.ts
prove-stocktake-db: ok (opening movements = counted qty, re-approve/edit blocked, stock sum)

> warehouse-wms@0.1.0 prove:stock-from-movements
> tsx scripts/prove-stock-from-movements.ts
prove-stock-from-movements: ok (no raw qty column/UI · sumMovementQty seam · /api/stock read)

> warehouse-wms@0.1.0 prove:stock-from-movements-db
> tsx scripts/prove-stock-from-movements-db.ts
prove-stock-from-movements-db: ok (opening+receipt/issue/transfer = independent SUM; no raw qty column/UI)
```

## Key routes / seams

- Read: `src/server/stock/sum-movement-qty.ts`, `list-stock-balances.ts`
- API/UI: `GET /api/stock`, `/stany` (read-only list)
- Prove: `npm run prove:stock-from-movements`, `npm run prove:stock-from-movements-db`

## Notes

- Renamed stocktake migration to `20260922081000_*` so it applies after Location on a fresh database (previous timestamp sorted before Location and broke `migrate deploy`).
- Out of scope held: caching layers, F007 scan flows, shopping lists, Symfonia.
