# F013 · Two-step cafe issue with signature

## Outcome

Cafe issue is two steps: on the hall the warehouse user prepares a document (scan or catalog → quantities → cafe destination → prepared/in-transit doc); on site a finger signature confirms receipt and only then does stock leave the warehouse.

## Scope

- Hall prepare: scan/catalog → qtys → cafe → document stays prepared / in-transit (no stock decrease yet).
- On-site finger signature on the prepared document; signature posts the issue movements that leave warehouse stock.

## Out of scope

- Emergency issue without signature (F018).
- Returns and renovation.

## Acceptance

- Preparing a cafe issue creates a document in prepared/in-transit state and does not change warehouse stock balances.
- After finger signature on that document, issue movements post and warehouse stock decreases by the signed quantities.
- Without a signature the document remains prepared/in-transit and stock still shows at the warehouse locations.
- Actor and timestamp of the signature are visible on the document or in movement history.

## Notes

- Cafe issue signature rule: stock leaves warehouse only after signature (emergency bypass is F018).
- “Cafe” is the destination context for issue; exact cafe location coding follows existing Locations.
