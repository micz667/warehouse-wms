# Outcome · F001 App foundation

## Result

A developer can clone the repo, start Postgres, migrate an empty baseline, and run a Next.js Polish shell page. `npm run check` exists and passes.

## Acceptance evidence

- README documents install, `.env.example`, Docker Compose, `npm run dev`, and `npm run check`.
- `npm run check` on the candidate (lint + `tsc --noEmit` + `prisma validate`):

```
> warehouse-wms@0.1.0 check
> npm run lint && npm run typecheck && npm run prisma:validate

> warehouse-wms@0.1.0 lint
> eslint

> warehouse-wms@0.1.0 typecheck
> tsc --noEmit

> warehouse-wms@0.1.0 prisma:validate
> prisma validate

The schema at prisma/schema.prisma is valid 🚀
```

- `npm run dev` served HTTP 200 at `/` with Polish shell copy including «Magazyn», «Warehouse WMS», and «Lekki system magazynowy…».
- Prisma: `prisma/schema.prisma` + migration `20260922000000_empty_baseline`; on a fresh Postgres database `npx prisma migrate deploy` applied that migration and `migrate status` reported up to date.

## Notes

- No auth, catalog, stock models, or Symfonia. Schema has no writable stock quantity column.
- Local proof used system Postgres with credentials from `.env.example`; Docker Compose is the documented path for developers.
