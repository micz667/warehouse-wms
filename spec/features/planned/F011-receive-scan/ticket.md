# F011 · Receive by scan with inline catalog add

## Outcome

A warehouse user receives stock by scanning an item, entering quantity, and choosing a location. An unknown barcode opens an inline catalog add (name, tags, description, barcode) in the POC style, then the receive finishes without leaving the hall flow.

## Scope

- Przyjmij path: scan → qty → location → receipt movement.
- Unknown barcode → inline create item (name, tags/attributes, description, barcode), then continue receive.

## Out of scope

- Cafe issue, transfer, or return flows.
- Symfonia catalog import.

## Acceptance

- Completing Przyjmij with a known barcode posts a receipt movement at the chosen location for the entered qty.
- Scanning an unknown barcode opens inline catalog fields (name, tags, description, barcode) without navigating away to a separate admin catalog screen.
- Saving the inline item and finishing receive posts the receipt against the new catalog row.
- The new item appears in the searchable catalog afterwards with the scanned barcode.

## Notes

- POC-style inline add: keep fields minimal; photo optional if already easy from F003.
