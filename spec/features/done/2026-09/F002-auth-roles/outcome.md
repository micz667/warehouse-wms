# Outcome · F002 Auth and roles

## Result

Users sign in with credentials; roles magazynier / architekt / admin live in Prisma; the Polish shell shows the current role; a sample admin route returns 401/403 when session or role is wrong. Shared hall password is gone.

## Acceptance evidence

Candidate for native check: *(filled after final commit)*.

- Unauthenticated `/` → 307 to `/login` (live against `npm start` on :3000).
- Seeded admin `admin@local` / `change-me` signs in (Auth.js credentials CSRF callback sets `authjs.session-token`) and sees shell copy «Rola: Administrator», email, «Wyloguj», «Widok administratora…»; logout returns to `/login` (browser + cookie flow).
- `npm run prove:gate-role` — pure gate: missing → 401, wrong role → 403, admin → ok.
- `npm run prove:auth-http` against running server — redirect, API 401 (anon), 403 (magazynier JWT), 200 (admin JWT).
- Live `GET /api/sample/admin-only` with admin session cookie → 200 JSON; without cookie → 401.

## Notes

- Placeholders only in README / `.env.example` (`admin@local` / `change-me`). No SSO, magic links, or Symfonia.
- `AUTH_TRUST_HOST=true` for local Auth.js host trust.
