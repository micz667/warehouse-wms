# Outcome · F008 Architect shopping lists

## Result

Architects (and admin) build a **draft** shopping list from the searchable catalog, add qty/optional note lines, and **submit** it for hall fulfillment. Magazynier (and admin) see submitted lists and **check off** lines; when every line is checked the list becomes **done**. Architect/admin also browse **history** (done lists). Checklist only — no movements, reservations, or purchasing.

## Domain decisions

- Statuses: `draft → submitted → done` (`ShoppingListStatus`).
- One catalog item per list (unique `listId` + `catalogItemId`); qty must be positive.
- Draft edits only; submit requires ≥1 line; check-off only while `submitted`.
- Auto-`done` when the last unchecked line is checked; explicit `complete` also available for the hall.
- Role split: create/submit = architekt+admin; fulfill = magazynier+admin; history API scope = architekt+admin.

## Acceptance evidence

1. Architect creates and submits a list — `npm run prove:shopping-lists-db` (create → lines → submit).
2. Magazynier sees submitted lists and marks lines checked — same DB prove (`listShoppingLists` submitted scope + `setShoppingListLineChecked`).
3. Admin/architect view list history — same DB prove (`statuses: ["done"]` after auto-done / complete).
4. `npm run check` includes `prove:shopping-lists` and `prove:shopping-lists-db`.

`npm run check` on clean candidate `121796c` (implementation `db4adb7` + board/outcome):

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role && npm run prove:catalog && npm run prove:locations && npm run prove:stocktake && npm run prove:stocktake-db && npm run prove:stock-from-movements && npm run prove:stock-from-movements-db && npm run prove:scan-movements && npm run prove:scan-movements-db && npm run prove:shopping-lists && npm run prove:shopping-lists-db

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

> warehouse-wms@0.1.0 prove:scan-movements
> tsx scripts/prove-scan-movements.ts
prove-scan-movements: ok (roles · paired transfer · negative issue refuse · scan UI seams)

> warehouse-wms@0.1.0 prove:scan-movements-db
> tsx scripts/prove-scan-movements-db.ts
prove-scan-movements-db: ok (receipt/transfer/issue + actor history; issue refuses negative)

> warehouse-wms@0.1.0 prove:shopping-lists
> tsx scripts/prove-shopping-lists.ts
prove-shopping-lists: ok (create architekt · fulfill magazynier · history · UI seams)

> warehouse-wms@0.1.0 prove:shopping-lists-db
> tsx scripts/prove-shopping-lists-db.ts
prove-shopping-lists-db: ok (create→submit→check→done; edit blocked; history)
```

## Key routes / seams

- Domain: `src/server/shopping-lists/`
- APIs: `GET|POST /api/shopping-lists`, `GET /api/shopping-lists/[id]`, `POST …/lines`, `DELETE …/lines/[lineId]`, `POST …/submit`, `PATCH …/lines/[lineId]/check`, `POST …/complete`
- UI: `/zakupy`, `/zakupy/[id]`
- Prove: `npm run prove:shopping-lists`, `npm run prove:shopping-lists-db`

## Notes

- Out of scope held: purchasing, Symfonia PO, stock reservation, converting list lines into movements.
