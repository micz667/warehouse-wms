# Build

## TRACK

- Greenfield `micz667/warehouse-wms`. Limen board + Cursor pack in repo.
- Stack: Next.js App Router, Postgres, Prisma, Auth.js, Tailwind, Android PWA scan.
- MVP locked in conversation 2026-09-22; Symfonia mapping dropped for now.

## NOW

- F009 · Admin users and movement history

## NEXT

- (empty — F009 is the last planned MVP slice)

## PROVEN

- F008 · Architect shopping lists (draft→submit→checklist; architekt create; magazynier check-off; history)
- F007 · Scanned receipt / transfer / issue (paired transfer rows; issue refuses negative; camera+manual scan)
- F006 · Stock balances from movements (sumMovementQty; no raw qty column/UI; prove vs independent SUM)
- F005 · Stocktake session → opening movements (draft/counting/approved; approve posts opening movements; stock = movement sum)
- F004 · Locations (unique codes, admin CRUD, stub picker + Code128 label for F007)
- F003 · Catalog + barcode (Code128 labels, searchable CRUD, optional photo, magazynier/admin write)
- F002 · Auth and roles (credentials + magazynier/architekt/admin + Polish shell + sample 401/403)
- F001 · App foundation runs locally (Next.js + Prisma empty baseline + `npm run check` + Polish shell)
