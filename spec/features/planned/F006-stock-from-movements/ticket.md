# F006 · Balances equal movement sums

## Outcome

Anywhere stock is shown, quantity equals the sum of movements for that item and location (or item total).

## Scope

- Read model or SQL sum from movements; no writable qty column on ItemLocation that bypasses movements.

## Out of scope

- Caching layers that can drift without tests.

## Acceptance

- After opening + a known movement set, displayed qty matches an independent sum query.
- There is no admin UI to type a raw on-hand qty.

## Notes


