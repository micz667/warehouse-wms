# Build

## TRACK

- Greenfield `micz667/warehouse-wms`. Limen board + Cursor pack in repo.
- Stack: Next.js App Router, Postgres, Prisma, Auth.js, Tailwind, Android PWA scan.
- MVP locked in conversation 2026-09-22; Symfonia mapping dropped for now.
- **MVP board complete** — F001–F009 proven.
- **Post-MVP hall UX slice complete** — hybrid entry, cafe issue prepare/sign/emergency, returns/renovation, inventory variances; hard domain unchanged. Symfonia still out of scope.
- **F019 hardening** landed on main (`af40164`).

## NOW

- F020 · Category-prefix item codes (SKU = Code128) — draft PR #23 / `feat/import-poc-catalog`

## NEXT

- (empty after F020)

## PROVEN

- F019 · Hardening (stock locks, atomic cafe sign, opening guard, seed, Next 16.4.2)
- F018 · Emergency issue without signature (conscious, logged bypass)
- F017 · Inventory session with variances (count → variances → approve correcting movements)
- F016 · Good return and return-to-renovation (shelf vs renovation → batch vendor issue)
- F015 · Wrong-movement correction and label reprint (storno / opposite movement; reprint/reattach)
- F014 · Movement history on the product card (SKU history from card/hub; no admin required)
- F013b · Cafe signature and receipt (finger-sign → issue movements; stock leaves)
- F013a · Cafe issue prepare / build package (hall; prepared/in-transit; stock unchanged)
- F012 · Shelf transfer and where-is lookup (shelf↔shelf; stock+locations for an item)
- F011 · Receive by scan with inline catalog add (unknown barcode → POC create, then receipt)

## Earlier proven

- 2026-09: F001 · App foundation; F002 · Auth and roles; F003 · Catalog + barcode; F004 · Locations; F005 · Stocktake opening; F006 · Stock from movements; F007 · Scanned receipt / transfer / issue; F008 · Architect shopping lists; F009 · Admin users and movement history; F010 · Scan hub
