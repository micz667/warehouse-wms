# Outcome · F002 Auth and roles

## Result

Users sign in with credentials; roles magazynier / architekt / admin live in Prisma; the Polish shell shows the current role; a sample admin route returns 401/403 when session or role is wrong. Shared hall password is gone.

## Acceptance evidence

- Unauthenticated visitors are sent to login — `GET /` → 307 `Location: /login?callbackUrl=…` against `npm start` on :3000.
- Seeded admin can sign in and sign out — credentials CSRF login as `admin@local` / `change-me` sets `authjs.session-token`; home HTML contains «Rola:», «Administrator», `admin@local`, «Wyloguj», «Widok administratora»; logout returns to `/login` (browser).
- Role visible in shell and enforced on sample route — shell shows «Rola: Administrator»; `GET /api/sample/admin-only` without cookie → 401; magazynier JWT → 403; admin session → 200.

`npm run check` on clean candidate `ed7cd94`:

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate && npm run prove:gate-role

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
```

`npm run prove:auth-http` against the same build: `prove-auth-http: ok (redirect, 401, 403, 200)`.

## Notes

- Placeholders only in README / `.env.example` (`admin@local` / `change-me`). No SSO, magic links, or Symfonia.
- `AUTH_TRUST_HOST=true` for local Auth.js host trust.
