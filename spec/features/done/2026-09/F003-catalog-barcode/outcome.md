# Outcome · F003 Catalog + barcode

## Result

Magazynier and admin can create and edit catalog SKUs (name, category, unit, optional photo) with an auto-generated unique **Code128** barcode; the searchable list and label print view show the item. Architect may view. `createCatalogItem` is the seam for F005 stocktake create-during-count.

## Acceptance evidence

1. Creating an item persists and appears in search — `createCatalogItem` + `listCatalogItems` in `npm run prove:catalog-http`; UI `/katalog` with `?q=` via `GET /api/catalog`.
2. Barcode unique; label renders Code128 — duplicate barcode → `barcode_taken`; `/katalog/[id]/etykieta` HTML includes the barcode value; symbology JsBarcode `CODE128` (`WMS` + 12 hex).
3. Optional photo stores and displays — `POST /api/catalog/[id]/photo` writes under `storage/catalog/`, served at `/uploads/catalog/[filename]`; item page HTML includes `photoPath`; fetch of that URL → 200 (same prove script).
4. Role gates — anon POST → 401; architekt POST → 403; magazynier POST → 201. Native `npm run check` includes `prove:catalog`.

`npm run check` on clean candidate (after board/outcome commit — sha filled in companion commit message / PR):

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role && npm run prove:catalog

prove-gate-role: ok
prove-catalog: ok (Code128 value shape + write/read gates)
```

`npm run prove:catalog-http` against `npm start` on :3000:

```
prove-catalog-http: ok (persist+search, unique barcode, 401/403/201, label, photo)
```

## Notes

- Photos: `storage/catalog/` + route handler (not `public/`) so uploads work under `next start` without restart.
- Seed unchanged: `admin@local` / `change-me`.
- Out of scope held: no Symfonia, prices, stock qty, locations, stocktake UX.
