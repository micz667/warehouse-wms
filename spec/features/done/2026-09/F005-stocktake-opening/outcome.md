# Outcome · F005 Stocktake opening

## Result

Users run a stocktake session (`spis z natury`), count qty per item × location (inline catalog create allowed), and on approve the system posts **opening** movements in one transaction. Stock shown on `/stany` and `GET /api/stock` equals the sum of movements — no writable raw qty column. Approved sessions cannot be re-approved or edited.

## Acceptance evidence

1. Approving a session creates movements whose sum equals counted qty per item/location — `approveStocktakeSession` + `getStockBalance` / `listStockBalances` in `npm run prove:stocktake-db`.
2. Re-approving or editing an approved session is blocked — same prove (`already_approved` / `invalid_status`; movement count unchanged).
3. Stock endpoints/UI reflect opening balances — `GET /api/stock`, Polish `/stany` UI; covered by prove-stocktake-db list/sum and optional HTTP prove.
4. `npm run check` includes `prove:stocktake` (role gates) and `prove:stocktake-db` (discriminating acceptance).

`npm run check` on clean candidate `212be08`:

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role && npm run prove:catalog && npm run prove:locations && npm run prove:stocktake && npm run prove:stocktake-db

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
```

## Key routes

- UI: `/spis`, `/spis/[id]`, `/stany`
- API: `GET|POST /api/stocktakes`, `GET /api/stocktakes/[id]`, `POST …/start`, `POST …/approve`, `POST …/lines`, `DELETE …/lines/[lineId]`, `GET /api/stock`

## Notes

- Write: `magazynier`, `admin`. Read: all signed-in roles.
- F006 remains NEXT for balance-model hardening; F005 ships a minimal movement-sum read model sufficient for acceptance.
- Out of scope held: variance stocktake, blind count, F007 daily movements, F008 shopping lists.
