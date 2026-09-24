# Outcome · F013b Cafe signature and receipt

## Result

At the cafe, a magazynier opens a prepared paczka and the recipient finger-signs on the pad. Only then do issue movements post and warehouse stock drop by the signed line quantities. Actor and timestamp show on the document.

## Domain decisions

- `CafeIssueStatus.received` after successful sign; signature PNG data URL + `signedAt` / `signedById` on `CafeIssue`.
- One transaction: validate prepared doc + non-empty signature → post `issue` Movement rows (same negative-stock rule as hall issue) → set status `received`.
- No issue movements until signature succeeds; failed / blank / re-sign leave stock and status unchanged.
- Roles unchanged: magazynier + admin (CAFE_ISSUE_WRITE_ROLES).

## Acceptance evidence

1. Signing a prepared document posts issue movements and decreases warehouse stock — `npm run prove:cafe-signature-db`.
2. Without a signature the document stays prepared and stock still shows at the warehouse — same DB prove (blank sign rejected; balances unchanged).
3. Signature actor and timestamp visible on the document — same DB prove (`signedBy` / `signedAt`) + `/ruchy/wydanie/[id]` receipt block.
4. Signing applies only to an existing prepared cafe issue — re-sign and missing id blocked in DB prove; domain checks `status === "prepared"`.

`npm run check` on clean candidate `60e27b1` (working tree clean):

```
prove-cafe-signature: ok (roles · sign posts issue · pad/API · prepared-only · no nested form)
prove-cafe-signature-db: ok (sign posts issue · stock down · no-sign stays · actor/ts · prepared-only)
… full native lane green (lint · typecheck · prisma validate · all prior proves) …
```

## Key routes / seams

- UI: `src/components/cafe-signature-pad.tsx` on `/ruchy/wydanie/[id]` (prepared); receipt metadata when `received`
- Domain: `src/server/cafe-issues/sign-cafe-issue.ts`
- API: `POST /api/cafe-issues/[id]/sign`
- Prove: `npm run prove:cafe-signature`, `npm run prove:cafe-signature-db` (in `npm run check`)

## Notes

- Out of scope held: hall prepare (F013a), emergency issue (F018), returns/renovation, Symfonia, product-card movement history (F014).
- Next: F014 · Movement history on the product card.
