# Build

## TRACK

- Greenfield `micz667/warehouse-wms`. Limen board + Cursor pack in repo.
- Stack: Next.js App Router, Postgres, Prisma, Auth.js, Tailwind, Android PWA scan.
- MVP locked in conversation 2026-09-22; Symfonia mapping dropped for now.
- **MVP board complete** — F001–F009 proven.
- **Post-MVP hall UX slice** — hybrid entry (scan hub + process tiles), cafe issue signature rule, floor gestures over menu navigation; hard domain (roles, catalog, stock-from-movements) unchanged. Symfonia still out of scope.

## NOW

- F013a · Cafe issue prepare / build package (hall)

## NEXT

- F013b · Cafe signature and receipt
- F014 · Movement history on the product card
- F015 · Wrong-movement correction and label reprint (storno / opposite movement; reprint/reattach)
- F016 · Good return and return-to-renovation (shelf vs renovation → batch vendor issue)
- F017 · Inventory session with variances (count → variances → approve correcting movements)
- F018 · Emergency issue without signature (conscious, logged bypass)

## PROVEN

- F012 · Shelf transfer and where-is lookup (shelf↔shelf; stock+locations for an item)
- F011 · Receive by scan with inline catalog add (unknown barcode → POC create, then receipt)
- F010 · Magazynier lands on scan hub and process tiles (scan-first + Przyjmij / Wydaj / Przenieś / Historia)
- F009 · Admin users and movement history (create+role change; filtered audit on Movement ledger)
- F008 · Architect shopping lists (draft→submit→checklist; architekt create; magazynier check-off; history)
- F007 · Scanned receipt / transfer / issue (paired transfer rows; issue refuses negative; camera+manual scan)
- F006 · Stock balances from movements (sumMovementQty; no raw qty column/UI; prove vs independent SUM)
- F005 · Stocktake session → opening movements (draft/counting/approved; approve posts opening movements; stock = movement sum)
- F004 · Locations (unique codes, admin CRUD, stub picker + Code128 label for F007)
- F003 · Catalog + barcode (Code128 labels, searchable CRUD, optional photo, magazynier/admin write)

## Earlier proven

- 2026-09: F001 · App foundation; F002 · Auth and roles
