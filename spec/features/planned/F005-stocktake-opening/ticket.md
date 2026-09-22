# F005 · Stocktake posts opening stock

## Outcome

Users run a stocktake session, count qty per item per location (creating items if missing), and on approve the system posts opening movements so balances exist.

## Scope

- Stocktake session lifecycle: draft → counting → approved.
- Line: item, location, counted qty; allow create-item inline.
- Approval writes opening movements in one transaction.

## Out of scope

- Recurring variance stocktake against existing system qty (decide later).
- Blind count process complexity.

## Acceptance

- Approving a session creates movements whose sum equals counted qty per item/location.
- Re-approving or editing an approved session is blocked or clearly versioned (no double post).
- Stock endpoints/UI reflect opening balances after approve.

## Notes

- Opening movement type is explicit in the domain model.
