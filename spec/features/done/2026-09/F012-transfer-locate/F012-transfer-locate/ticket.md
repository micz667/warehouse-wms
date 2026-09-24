# F012 · Shelf transfer and where-is lookup

## Outcome

A warehouse user moves stock shelf to shelf by scanning, and can answer “where is X?” with current stock and locations for an item.

## Scope

- Przenieś: location → location transfer via scan (paired movements per F006/F007 contract).
- Stock+locations lookup for one item (“where is X?”) reachable from the hall hub or product context.

## Out of scope

- Cross-warehouse moves, reservations, picking waves.
- Cafe issue / signature flow.

## Acceptance

- Completing Przenieś decreases source location and increases destination by the same qty in one transaction.
- Transfer from a location refuses when available balance would go negative.
- Looking up an item shows each location that holds it and the qty at that location (sum of movements).
- Zero-balance locations are not listed as holding stock (or are clearly empty if shown).

## Notes

- Reuses existing paired `transfer` movement rows; this ticket is the hall gesture and locate UX, not a new stock model.
