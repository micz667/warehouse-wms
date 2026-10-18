# F019 · Hardening: stock races, double posts, seed and uploads

## Outcome

Parallel hall writes cannot drive a location negative. Cafe sign and emergency issue post inventory once even under a double tap. Opening stocktake can be approved only once so opening movements do not double. Seed no longer overwrites an existing admin password. Catalog photos are served only to logged-in users and uploads are checked by magic bytes. Next.js sits on a patched 16.x.

## Scope

- Stock-decreasing writers: advisory lock (or equivalent) before balance read inside the transaction — starting seam `src/server/movements/post-issue.ts` and shared helper.
- Atomic cafe prepared→received claim before posting issues; opening stocktake approve guard + atomic status flip.
- Seed create-if-missing; Next 16.x patch + non-major `npm audit fix`; authenticated `/uploads/catalog`; README check/DB port truth.

## Out of scope

- Role/JWT refresh, user deactivation/password reset, PWA manifest, deploy configs, Movement source-document linking, middleware→proxy rename (unless trivial).

## Acceptance

- `npm run prove:stock-concurrency-db` — parallel decrements leave no negative balance.
- `npm run prove:cafe-double-post-db` — concurrent sign/emergency post issues once.
- `npm run prove:opening-stocktake-once-db` — second opening approve is refused; stock not doubled.
- Seed leaves an existing admin `passwordHash` unchanged unless an explicit reset flag/env is set.
- Unauthenticated GET `/uploads/catalog/...` is denied; photo save rejects non-image bytes with a spoofed MIME.
- `npm run check` is green at the candidate commit (includes the new +db proves).
- `next` is at patched 16.x (≥16.4.1); audit critical/high from non-major `npm audit fix` reduced where available.

## Notes

- Compose on main publishes Postgres at host `5432` — document that, do not invent `5433`.
- Owner asked for this board ticket despite an earlier “do not invent F019” line on an empty NEXT.
