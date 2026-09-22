# Outcome · F007 Hall scans receipt transfer issue

## Result

On the hall PWA, magazynier/admin complete **Przyjęcie**, **Przesunięcie**, and **Wydanie** by scanning (or typing) item and location barcodes, posting signed movements. Recent history shows actor + timestamp. Architect can view history; write is gated to magazynier + admin.

## Domain decisions

- **Transfer** = paired pair of `Movement` rows with `type: transfer` (−qty at source, +qty at destination) in one transaction — same contract as F006 prove seeds.
- **Negative stock rule:** issue and transfer-from refuse when `sumMovementQty(item, location) < qty` (HTTP 409 / `insufficient_stock`). No overdraw on MVP.

## Acceptance evidence

1. Receipt / transfer / issue post movements with `createdById` + `createdAt`, listed by `listRecentMovements` — `npm run prove:scan-movements-db`.
2. Transfer decreases source and increases destination by the same qty (balances via `sumMovementQty`) — same DB prove.
3. Issue refuses when it would drive balance negative; refused call leaves balance unchanged — same DB prove.
4. `npm run check` includes `prove:scan-movements` and `prove:scan-movements-db`.

`npm run check` on clean candidate `c4134b1` (implementation `c5e98e2` + board/outcome):

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role && npm run prove:catalog && npm run prove:locations && npm run prove:stocktake && npm run prove:stocktake-db && npm run prove:stock-from-movements && npm run prove:stock-from-movements-db && npm run prove:scan-movements && npm run prove:scan-movements-db

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
```

## Key routes / seams

- Post: `src/server/movements/post-receipt.ts`, `post-transfer.ts`, `post-issue.ts`
- APIs: `POST /api/movements/{receipt,transfer,issue}`, `GET /api/movements`, `GET /api/catalog/by-barcode/[code]`
- UI: `/ruchy`, `/ruchy/przyjecie`, `/ruchy/przesuniecie`, `/ruchy/wydanie`, `/ruchy/historia`
- Scan: `BarcodeScanner` (getUserMedia + BarcodeDetector / `@zxing/browser`) + manual entry
- Prove: `npm run prove:scan-movements`, `npm run prove:scan-movements-db`

## Notes

- Online-only MVP; no offline queue.
- Out of scope held: batch ASN, Zebra wedge as primary, shopping lists (F008), full admin audit (F009).
