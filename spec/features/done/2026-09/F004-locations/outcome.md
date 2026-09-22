# Outcome · F004 Locations

## Result

Admin can create and edit flat hall locations (`code` + `label`); magazynier and architekt can list, open, pick, and resolve a location by typed/scanned code. Location codes are unique and render as Code128 on a print label. `LocationPicker` + `findLocationByCode` are the seam for F007 movements.

## Acceptance evidence

1. Location codes are unique — `createLocation` returns `code_taken` on duplicate (normalized); DB unique index on `Location.code`. Proven in `npm run prove:locations-http`.
2. Selectable/scannable stub picker — `/lokalizacje/wybierz` embeds `LocationPicker`; `GET /api/locations/by-code/[code]` resolves for magazynier. Same HTTP prove.
3. `npm run check` includes `prove:locations` (normalize + admin write / hall read gates).

`npm run check` on clean candidate `a2777b3`:

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role && npm run prove:catalog && npm run prove:locations

> warehouse-wms@0.1.0 lint
> eslint

> warehouse-wms@0.1.0 typecheck
> tsc --noEmit

> warehouse-wms@0.1.0 prisma:validate
> prisma validate
The schema at prisma/schema.prisma is valid 🚀

> warehouse-wms@0.1.0 prove:gate-role
> tsx scripts/prove-gate-role.ts
prove-gate-role: ok

> warehouse-wms@0.1.0 prove:catalog
> tsx scripts/prove-catalog.ts
prove-catalog: ok (Code128 value shape + write/read gates)

> warehouse-wms@0.1.0 prove:locations
> tsx scripts/prove-locations.ts
prove-locations: ok (code normalize + admin write / hall read gates)
```

`npm run prove:locations-http` against `npm start` on :3000 (same tree):

```
prove-locations-http: ok (unique code, 401/403/201, by-code, picker, label)
```

## Key routes

- UI: `/lokalizacje`, `/lokalizacje/nowa`, `/lokalizacje/[id]`, `/lokalizacje/[id]/etykieta`, `/lokalizacje/wybierz`
- API: `GET|POST /api/locations`, `GET|PATCH /api/locations/[id]`, `GET /api/locations/by-code/[code]`

## Notes

- Write: `admin` only. Read/pick: `magazynier`, `architekt`, `admin`.
- Out of scope held: multi-warehouse, putaway, stock balances, movements, stocktake.
