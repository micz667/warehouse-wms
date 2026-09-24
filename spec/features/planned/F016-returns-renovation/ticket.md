# F016 · Good return and return-to-renovation

## Outcome

Returned goods take one of two hall paths: good return goes back onto a shelf; damaged or dirty return goes to a renovation section and can later leave as a batch vendor issue.

## Scope

- Good return: scan → qty → shelf location → stock back on warehouse shelf.
- Return → renovation section location → later batch vendor issue from that section.

## Out of scope

- Full vendor RMA / purchase credit documents in Symfonia.
- Cafe issue prepare and signature receipt (F013a / F013b).

## Acceptance

- Completing a good return increases the chosen shelf location by the returned qty via movements.
- Routing a return to renovation places stock at the renovation section location (visible in “where is X?” / balances).
- Batch vendor issue from renovation decreases renovation-section stock by the issued qtys and records the movement with actor and time.
- Good-return and renovation paths are distinct gestures (user cannot confuse them as the same single button with no destination choice).

## Notes

- Renovation section is a Location (or small set of locations), not a parallel stock ledger.
