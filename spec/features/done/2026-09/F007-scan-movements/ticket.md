# F007 · Hall scans receipt transfer issue

## Outcome

On Android Chrome PWA, a warehouse user completes receipt, transfer, and issue by scanning item (and locations as needed), posting movements.

## Scope

- Camera scan via getUserMedia / barcode library; fallback manual entry.
- Three flows: receipt (to location), transfer (from→to), issue (from location).

## Out of scope

- Offline queue, batch ASN, Zebra keyboard wedge as primary.

## Acceptance

- Each flow posts a movement visible in history with actor and timestamp.
- Transfer decreases source and increases destination by the same qty.
- Issue refuses when it would drive balance negative (unless product later allows) — document chosen rule in notes when implementing.

## Notes

- Online-only for MVP.
- Transfer is a paired pair of `Movement` rows (`type: transfer`): −qty at source and +qty at destination in one transaction (F006 contract).
- Negative stock rule: issue (and transfer from source) refuses when `sumMovementQty(item, location) < qty` — no overdraw on MVP.
