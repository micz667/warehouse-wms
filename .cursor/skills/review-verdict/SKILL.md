---
name: review-verdict
description: Independent review of a candidate against its ticket. First line is PASS or FAIL with the sha. Blocking is only a proven acceptance break. Use when reviewing a branch, PR, or candidate commit, after a slice lands, or when asked for a second pair of eyes. Does not rewrite the candidate.
---

# Review verdict

Fresh eyes on this diff, not a second tour of the architecture. Review; do not rewrite.

## Procedure

1. Confirm `git rev-parse HEAD` matches the candidate you were given. A mismatch is a finding.
2. Begin at the blast radius: the diff, its callers, its contracts, its tests. Follow changed boundaries outward only to chase a concrete risk.
3. Prosecute the riskiest claim first. Ask what would make this candidate wrong, then check whether anything actually rules that out.
4. Run the checks that discriminate. Decorative green is not evidence. One full proof at most (`npm run check`). A transient failure is reported as transient; do not rerun the lane to chase it.
5. Install from the lockfile before the first JavaScript check. If install or a check cannot run, mark that check unverified. Unverified is never blocking.

## Labels

Each finding is **proven**, **plausible**, or **unverified**, with paths and actionable reasoning. Never present suspicion as fact.

- **Blocking** is only a proven break of an acceptance bullet. FAIL means at least one blocking finding.
- PLAUSIBLE is never blocking. A plausible race, a lint bypass, or a hardening idea is a note, not a FAIL.
- Evidence recorded at a different commit or a dirty tree is unverified, and saying so is not a finding against the candidate.
- The feature folder's own review, notes, and outcome files and pre-existing formatting are outside the diff.
- Ticket or board drift is a finding to report, not a thing to repair.

A re-review that names a prior `review-N.md` is bounded by that file: verify each previously blocking finding against the new candidate, inspect the delta, and file anything else as a note. Do not re-prosecute what the findings file already settled unless the new diff reopens it.

## Final message

First line, nothing before it:

```
PASS <sha>
```

or

```
FAIL <sha>
```

PASS carries notes. FAIL still includes notes and the checks actually run with real results. The message stands alone so it can be filed verbatim as `spec/features/.../review-N.md`.
