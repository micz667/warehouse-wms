# Outcome · F013a Cafe issue prepare / build package (hall)

## Result

A magazynier builds a **paczka do kawiarni** from Wydaj / hub: scan or catalog → quantities → cafe destination → **Przygotuj paczkę**. The document persists as **prepared / in-transit** with line items. Warehouse stock balances do not change.

## Domain decisions

- New `CafeIssue` / `CafeIssueLine` models; status `prepared` means in-transit awaiting signature (F013b).
- Prepare creates **no** `Movement` rows — stock remains SUM(movements) only.
- Roles match issue write: magazynier + admin.
- Cafe destination is an existing `Location`. Immediate hall issue form removed from Wydaj; `POST /api/movements/issue` remains for F013b / proves.

## Acceptance evidence

1. Completing prepare creates a prepared/in-transit document with the chosen lines and cafe destination — `npm run prove:cafe-prepare-db`.
2. After prepare, warehouse stock balances (movement sums) are unchanged vs before prepare — same DB prove.
3. Prepared documents are listable and openable — same DB prove + `/ruchy/wydanie` list and `/ruchy/wydanie/[id]`.
4. This path alone cannot post stock-leaving issue movements — prepare creates zero `issue` Movement rows; hall UI POSTs only `/api/cafe-issues`.

`npm run check` on clean candidate (see follow-up commit SHA in board update):

```
prove-cafe-prepare: ok (roles · prepare no Movement · hall seams · list/reopen · no nested form)
prove-cafe-prepare-db: ok (prepared doc · stock unchanged · list/open · no issue movements)
… full native lane green …
```

## Key routes / seams

- UI: `src/components/cafe-prepare-form.tsx` (`/ruchy/wydanie`), detail `/ruchy/wydanie/[id]`
- Domain: `src/server/cafe-issues/prepare-cafe-issue.ts`, `list-cafe-issues.ts`, `get-cafe-issue.ts`
- API: `GET|POST /api/cafe-issues`, `GET /api/cafe-issues/[id]`
- Hub: Wydaj tile blurb “Paczka do kawiarni”; missing fields include `cafe`
- Prove: `npm run prove:cafe-prepare`, `npm run prove:cafe-prepare-db` (in `npm run check`)

## Notes

- Out of scope held: finger signature / stock leave (F013b), emergency issue (F018), returns, renovation, Symfonia.
- Next: F013b picks up prepared docs for signature + issue movements.
