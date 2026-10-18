# F020 · Category-prefix item codes (SKU = Code128)

## Outcome

Every new catalog item gets a short durable code such as `KRZ-0042`: category prefix plus sequence. That code is both the SKU and the Code128 value on labels. Admins maintain the prefix registry; hall receive and POC import use the same allocator. Changing an item’s category later does not renumber it.

## Scope

- Prefix registry in Postgres; atomic allocate; immutable codes once assigned.
- Create paths: catalog form, inline receive add, POC import script.
- Optional manufacturer/external barcode for scan lookup when the warehouse code differs.
- Admin UI to list/edit prefixes; seed mapping for POC categories; labels show short code + name.

## Out of scope

- Prod/deploy, Symfonia, reprinting historical POC-* / WMS* labels already in the field.
- Merging this branch (stays draft until owner merges).

## Acceptance

- `npm run prove:item-codes` shows format, immutability (category change keeps code), and fallback prefix for unknown category.
- `npm run prove:item-codes-db` allocates unique codes under parallel contention and stores external barcode for scan hub resolve.
- Catalog create and inline receive assign `PREFIX-NNNN` as both SKU and barcode (not `R-…` / `WMS…`).
- Import matches by `sourceRef` (`poc:<id>`), assigns category codes deterministically on a fresh DB, and keeps POC id in description.
- Admin-only prefix page lists category, prefix, next number, item count; prefix edit refused once any item uses that prefix.
- Label page still prints Code128 for the short code plus the item name.
- `npm run check` green on the candidate commit (includes the new proves).

## Notes

- Owner decision: code = SKU = Code128; Polish letters in prefixes map to ASCII (Ł→L, Ż→Z).
- Fallback prefix for uncategorised / unmapped: `INN` (`Bez kategorii`).
- Number zero-padded to 4 digits; grows past 9999 without wrapping.
