# Outcome · F018 Emergency issue without signature

## Result

When cafe finger signature is impossible, a magazynier (or admin) opens a prepared paczka and consciously issues without signature: open emergency form → reason/note → confirm checkbox → submit. Issue movements post, warehouse stock drops, and the document leaves prepared/in-transit with a clear emergency record (actor, timestamp, reason).

## Domain decisions

- Operates on existing prepared `CafeIssue` from F013a; does not replace the default F013a → F013b signed path.
- `signatureSkipped` + `emergencyNote` on `CafeIssue`; status becomes `received`; `signedAt` / `signedById` carry actor and time; `signatureData` stays null.
- API requires `confirmed: true` and a non-empty reason — silent auto-issue refused.
- Same issue movements and negative-stock rule as F013b sign; same write roles (magazynier + admin).

## Acceptance evidence

1. Conscious confirmation required (not a single prepare tap) — UI two-step + domain rejects `confirmed !== true` / blank note (`npm run prove:cafe-emergency`, `prove:cafe-emergency-db`).
2. After confirm, warehouse stock decreases and the doc is no longer prepared — same DB prove.
3. Document shows bypass with actor, timestamp, and reason — same DB prove + `/ruchy/wydanie/[id]` emergency receipt.
4. Normal signed path still works as default — DB prove signs a second prepared doc; F013b proves remain in `npm run check`.

`npm run check` on clean candidate `de64977` (working tree clean):

```
prove-cafe-emergency: ok (roles · confirm+note · posts issue · UI/API · signed path intact)
prove-cafe-emergency-db: ok (confirm+note · stock down · bypass logged · signed path intact)
prove-cafe-signature: ok (roles · sign posts issue · pad/API · prepared-only · no nested form)
prove-cafe-signature-db: ok (sign posts issue · stock down · no-sign stays · actor/ts · prepared-only)
prove-cafe-prepare: ok (roles · prepare no Movement · hall seams · list/reopen · no nested form)
… full native lane green (lint · typecheck · prisma validate · all prior proves including F016/F017) …
```

## Key routes / seams

- UI: `src/components/cafe-emergency-issue.tsx` on `/ruchy/wydanie/[id]` (prepared); emergency receipt when `signatureSkipped`
- Domain: `src/server/cafe-issues/emergency-issue-cafe-issue.ts`
- API: `POST /api/cafe-issues/[id]/emergency-issue`
- Prove: `npm run prove:cafe-emergency`, `npm run prove:cafe-emergency-db` (in `npm run check`)

## Notes

- Out of scope held: removing F013b, silent auto-issue, building prepare (F013a), Symfonia.
- Post-MVP hall UX board complete after this slice — no F019 invented.
