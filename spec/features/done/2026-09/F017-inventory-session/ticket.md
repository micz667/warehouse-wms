# F017 · Inventory session with variances

## Outcome

Beyond the opening stocktake, users run an inventory session: count on the floor, see variances against system stock, and approve so correcting movements bring balances in line.

## Scope

- Inventory session lifecycle for an existing catalog and stock (not only empty opening).
- Count lines → variance vs current movement-sum stock → approve posts correcting movements.

## Out of scope

- Blind multi-team count complexity and cycle-count scheduling.
- Opening-only stocktake (already F005).

## Acceptance

- Starting an inventory session lets users count qty per item per location against an already populated catalog.
- Before approve, the session shows variance (counted vs system stock) per counted line.
- Approving posts correcting movements so post-approve balances equal counted qtys for those lines.
- Re-approving an approved session is blocked or versioned so movements are not double-posted.

## Notes

- Design must keep stock = sum of movements; variance approve writes movements, never a raw qty column.
