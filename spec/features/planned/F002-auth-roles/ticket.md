# F002 · Users sign in with roles

## Outcome

Warehouse, architect, and admin users can sign in and see a role-appropriate shell. Shared hall password is gone.

## Scope

- Auth.js (or equivalent) with credentials; User and Role in Prisma.
- Seed one admin for local use.

## Out of scope

- SSO, magic links, Symfonia users.

## Acceptance

- Unauthenticated visitors are sent to login.
- Seeded admin can sign in and sign out.
- Role is visible in the shell and enforced on a sample server route (401/403 when wrong role).

## Notes

- Roles: magazynier, architekt, admin.
