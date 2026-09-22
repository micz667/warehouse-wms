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

- Build MVP on Next.js + Postgres + Prisma + Auth.js as an Android-first PWA.
- MVP slice order: foundation → auth/roles → catalog + barcodes → locations → stocktake opening → stock from movements → scanned receipt/transfer/issue → architect shopping lists → admin audit.
- Recurring stocktake with variance against system stock: decide later; design the catalog and movement model so it can land without a rewrite.
- Deferred: Symfonia export, Symfonia product import/mapping, offline-first transactions, reservations/picking, multi-warehouse, native/Zebra.
