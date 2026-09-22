# F001 · App foundation runs locally

## Outcome

A developer can clone the repo, configure Postgres, and start a Next.js app that renders a Polish shell page. Native check script exists.

## Scope

- Starting seam: repository root scaffold (Next.js App Router, Prisma, Tailwind).
- Boundary: no domain features yet beyond a placeholder home and health-friendly layout.

## Out of scope

- Auth, catalog, stock, PWA install prompt polish, Symfonia.

## Acceptance

- `README` documents install, env, `npm run dev`, and `npm run check`.
- `npm run check` passes on a clean tree.
- `npm run dev` serves a page that states the product name in Polish.
- Prisma schema file exists and migrates against Postgres to an empty baseline.

## Notes

- Postgres via Docker Compose is acceptable for local dev.
