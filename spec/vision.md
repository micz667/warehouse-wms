# Vision

## Product principles

- One operational truth: what stock is where, and how it moved.
- The system opens with a physical stocktake (`spis z natury`): articles and opening quantities are established on the floor, then approved as opening movements — never by typing a bare “quantity” field.
- Stock is only ever the sum of movements (including opening stocktake posts).
- Android PWA with camera scan is the default hall path; typed entry is the exception. No Zebra / collector requirement for now.
- Roles (warehouse, architect, admin), not a shared hall password.
- One durable catalog (SKU, barcode, photo, attributes) serves both hall operations and architects’ shopping lists. The first stocktake builds it; later stocktakes (when enabled) reuse it so counting is faster to organize.
- Commercial documents stay in Symfonia Handel (on-prem). This product is the warehouse operations layer. One-way movement export to Symfonia is a later phase — not MVP. Symfonia catalog import/mapping is out of scope for now.
- Simpler on the hall beats a full classical WMS (no reservations, picking waves, or multi-warehouse in the first horizon).
- `warehouse-poc` is UX/catalog inspiration only, not the code base we extend.

## Current direction

- MVP (F001–F009) is proven on Next.js + Postgres + Prisma + Auth.js as an Android-first PWA. Hard domain stays: roles, durable catalog, stock only as sum of movements.
- Post-MVP hall UX: hybrid entry — default scan hub plus process tiles (Przyjmij / Wydaj / Przenieś / Historia; Inwentaryzacja and Renowacja as further shortcuts). Procedures stay under the hood; the hall supports gestures, not system-menu navigation. Scan barcode or location first; the system asks only for missing fields. Unknown barcodes can open inline catalog add during receive.
- Cafe issue ships in two slices: hall prepare builds a package/document (in-transit / prepared) without stock leaving; then cafe finger signature/receipt posts the issue and stock leaves — or a conscious, logged “issue without signature” emergency (F018) bypasses signature on a prepared document. Wrong moves correct via storno/opposite movement; good returns vs renovation; inventory sessions beyond opening stocktake.
- Symfonia export and Symfonia product import/mapping stay out of scope for this horizon.
- Deferred: offline-first transactions, reservations/picking, multi-warehouse, native/Zebra.
