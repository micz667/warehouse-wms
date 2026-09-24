# Outcome · F010 Magazynier scan hub and process tiles

## Result

Signed-in **magazynier** opens `/` on the hall **scan hub**: process tiles Przyjmij / Wydaj / Przenieś / Historia, plus Inwentaryzacja (`/spis`) and Renowacja (`/renowacja` stub) shortcuts. Scanning an item or location barcode does not require choosing a procedure first; after the scan, the hub offers gestures and opens existing F007 forms with hub prefills so only still-missing fields are collected. Architect/admin keep the menu shell home.

## Domain decisions

- Hub reuses F007 post routes and forms; no parallel posting logic.
- Location scan + Przenieś prefills **source** (`fromLocationId`); destination remains missing.
- Renowacja is a reachable handoff stub (F016 owns the real gesture).

## Acceptance evidence

1. Magazynier home renders `ScanHub` with tiles Przyjmij / Wydaj / Przenieś / Historia — `npm run prove:scan-hub` (source seams on `page.tsx` + `scan-hub.tsx`).
2. Hub resolves `/api/catalog/by-barcode` then `/api/locations/by-code` before gesture choice — same prove + `scan-hub.tsx`.
3. `missingFieldsAfterHubScan` never re-asks the known scan identity; forms take `fromHub` prefills — same prove.
4. Inwentaryzacja → `/spis`, Renowacja → `/renowacja` from hub shortcuts — same prove.

`npm run check` on clean candidate `70ba8b4`:

```
> warehouse-wms@0.1.0 check
> … prove:scan-hub …

prove-scan-hub: ok (magazynier hub · tiles · scan-first · missing fields · shortcuts)
… all prior proves ok …
```

## Key routes / seams

- Home gate: `src/app/page.tsx` (`role === "magazynier"` → `ScanHub`)
- Hub UI: `src/components/scan-hub.tsx`
- Missing-field contract: `src/lib/hub-gesture-fields.ts`
- Prefill loader: `src/lib/load-hub-prefill.ts` → receipt / issue / transfer pages + forms
- Renowacja stub: `src/app/renowacja/page.tsx`
- Prove: `npm run prove:scan-hub` (in `npm run check`)

## Notes

- Out of scope held: receive/issue/transfer posting rework (F011+), architect/admin home redesign.
- Full receive/issue/transfer/history flows still live under `/ruchy/*` (F007).

## Browser smoke (mag@local)

At running `npm start` on localhost:3000 after seed:

- Landed on hub with Przyjmij / Wydaj / Przenieś / Historia.
- Unknown hub scan stayed on hub with inline error (no procedure required first).
- Przyjmij tile → `/ruchy/przyjecie`; Renowacja shortcut → `/renowacja` stub.

Frames: `/opt/cursor/artifacts/screenshots/f010-hub-first-viewport.webp` (tiles+shortcuts, camera off), `f010-hub-scan-error.webp`, `f010-przyjmij-form.webp`, `f010-renowacja-stub.webp`. Hub camera defaults off so shortcuts fit the first viewport.
