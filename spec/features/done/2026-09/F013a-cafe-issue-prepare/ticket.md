# F013a · Cafe issue prepare / build package (hall)

## Outcome

On the hall a Magazynier builds a cafe shipment package: scan or catalog lines, quantities, and cafe destination become a prepared document. Stock stays in the warehouse until a later cafe signature (or emergency path) posts the issue.

## Scope

- Prepare UX from Wydaj / scan hub: scan or catalog → quantities → cafe destination → multi-line package.
- Document ends in prepared / in-transit; list and open prepared docs for the later cafe step.
- Starting seam: hall Wydaj / hub issue prepare flow.

## Out of scope

- Finger signature UI and posting issue movements that leave stock (F013b).
- Emergency issue without signature (F018).
- Returns and renovation.

## Acceptance

- Completing prepare creates a prepared/in-transit document with the chosen line items and cafe destination.
- Warehouse stock balances are unchanged after prepare.
- Prepared documents are listable and openable for the later cafe step.
- This ticket alone cannot post issue movements that leave warehouse stock.

## Notes

- Cafe is the destination context for issue; exact cafe location coding follows existing Locations.
- Stock leave on signature is F013b; conscious no-signature bypass is F018.
