# F003 · Catalog items have barcodes

## Outcome

An admin or warehouse user can create and edit SKUs with name, category, unit, optional photo, and a generated barcode suitable for a label.

## Scope

- CRUD for items; Code128 (or chosen symbology) generation; simple label print view.
- Items can also be created later during stocktake (seam only; full stocktake UX is F005).

## Out of scope

- Symfonia import/mapping, price lists.

## Acceptance

- Creating an item persists it and shows it in a searchable list.
- Barcode value is unique; label view renders a scannable code.
- Optional photo upload stores and displays on the item.

## Notes

- Catalog is durable across stocktakes.
