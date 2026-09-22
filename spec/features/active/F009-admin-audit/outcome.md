# Outcome · F009 Admin users and movement history

## Result

Admin creates users (email/password/role) and changes roles from `/uzytkownicy`. Admin filters movement history on `/audyt` by date range, catalog item, location, and actor — all against the single Movement ledger (F005 opening + F007 receipt/transfer/issue). Hall `/ruchy/historia` stays the simple recent list.

## Domain decisions

- User write/read = admin only (`USER_WRITE_ROLES` / `USER_READ_ROLES`).
- Filtered audit API requires admin when any filter query param is present (`MOVEMENT_AUDIT_ROLES`); unfiltered recent list stays all signed-in roles.
- No parallel ledger — filters live on `listRecentMovements`.
- Create hashes password with bcrypt; role change does not touch password.
- Password-reset email and SIEM/archive left out of scope.

## Acceptance evidence

1. Admin can change a user role — `npm run prove:admin-audit-db` (`createUser` → `updateUserRole` → `listUsers`).
2. Movement history shows F005/F007 posts with filters that narrow results — same DB prove (opening + receipt; item/location/actor/date filters exclude noise).
3. `npm run check` includes `prove:admin-audit` and `prove:admin-audit-db`.

`npm run check` on clean candidate `5812082`:

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role && npm run prove:catalog && npm run prove:locations && npm run prove:stocktake && npm run prove:stocktake-db && npm run prove:stock-from-movements && npm run prove:stock-from-movements-db && npm run prove:scan-movements && npm run prove:scan-movements-db && npm run prove:shopping-lists && npm run prove:shopping-lists-db && npm run prove:admin-audit && npm run prove:admin-audit-db

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

> warehouse-wms@0.1.0 prove:admin-audit
> tsx scripts/prove-admin-audit.ts
prove-admin-audit: ok (admin user/audit gates · filter + UI seams)

> warehouse-wms@0.1.0 prove:admin-audit-db
> tsx scripts/prove-admin-audit-db.ts
prove-admin-audit-db: ok (role change · filters narrow opening/receipt)
```

## Key routes / seams

- Domain: `src/server/users/`, `src/server/movements/list-recent-movements.ts` (filters)
- APIs: `GET|POST /api/users`, `PATCH /api/users/[id]`, `GET /api/movements` (optional filters → admin)
- UI: `/uzytkownicy`, `/audyt`
- Prove: `npm run prove:admin-audit`, `npm run prove:admin-audit-db`

## Notes

- MVP planned board is complete after this landing; NEXT stays empty.
- Out of scope held: SIEM, immutable legal archive, Symfonia export.
