# Outcome · F011 Receive by scan with inline catalog add

## Result

On **Przyjmij**, a magazynier scans a known barcode (or uses hub prefill), enters qty and location, and posts a receipt movement. An unknown barcode opens POC-style inline catalog fields (Nazwa, Tagi, Opis, Kod kreskowy) on the same form — no trip to admin `/katalog` — then saving the item and finishing receive posts the receipt against the new catalog row, which is searchable by that barcode.

## Domain decisions

- Tags map to existing `category`; optional `description` added on `CatalogItem`.
- Hall inline create omits SKU/unit in the UI: unit defaults to `szt`, SKU is derived from the scanned barcode (`skuFromScannedBarcode`).
- Catalog POST accepts an explicit `barcode` so the scanned value sticks (F003 admin create still auto-generates when omitted).
- Issue/transfer keep error-on-unknown; only receipt wires `onUnknownBarcode`.

## Acceptance evidence

1. Known barcode receipt at location for qty — `npm run prove:receive-scan-db`.
2. Unknown barcode opens inline fields (name, tags, description, barcode) without admin catalog navigation — `npm run prove:receive-scan` (ReceiptForm + InlineCatalogCreate seams).
3. Inline create + receipt against new row — same DB prove.
4. New item searchable by scanned barcode (and description) — same DB prove.

`npm run check` on clean candidate `5a55243`:

```
> warehouse-wms@0.1.0 check
> … prove:receive-scan …
prove-receive-scan: ok (inline create seams · barcode create · no nested form)
> … prove:receive-scan-db …
prove-receive-scan-db: ok (known receipt · inline create+receipt · catalog search)
… all prior proves ok …
```

## Key routes / seams

- Receive UI: `src/components/receipt-form.tsx` + `src/components/inline-catalog-create.tsx`
- Unknown scan hook: `src/components/item-scan-field.tsx` (`onUnknownBarcode`)
- Create: `src/server/catalog/create-catalog-item.ts` + `POST /api/catalog` (barcode + description)
- Receipt: existing `postReceipt` / `POST /api/movements/receipt`
- Prove: `npm run prove:receive-scan` + `prove:receive-scan-db` (in `npm run check`)

## Notes

- Out of scope held: cafe issue, transfer, return, Symfonia import.
- Photo skipped (optional if easy from F003 — not required for hall POC fields).

## Browser smoke (mag@local)

At running `npm start` on localhost:3000 after seed:

- Przyjmij + unknown `F011SMOKE999` → inline Nazwa/Tagi/Opis/Kod (stayed on `/ruchy/przyjecie`).
- Zapisz pozycję → picked item; qty 2 + A-01 → `Przyjęto 2 → A-01`; receipt rows in DB.
- `/katalog` search `F011SMOKE999` → Farba test F011 with that barcode.

Frames: `/opt/cursor/artifacts/screenshots/f011-inline-create.webp`, `f011-receipt-ok.webp`, `f011-catalog-search.webp`.
