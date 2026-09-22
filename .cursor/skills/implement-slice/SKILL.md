---
name: implement-slice
description: Implements one seam-led slice in the current checkout — probe edit first, discriminating check, checkpoint commits. Use when implementing a ticket, repairing review findings, finishing uncommitted work in a worktree, or surveying a seam. Not for review, research, or board edits.
---

# Implement a slice

The instruction is the job; its ticket is the source of truth. The repository is territory to change, not a museum to tour. Only commits, written files, and the final message survive.

## Shape

Match the handoff. Unstated means slice.

- **slice** — one seam-led change; deliverable is one commit.
- **repair** — fix listed findings; start by reproducing the finding with the named test; deliverable is one commit.
- **survey** — mapping is the job; deliverable is a notes file, no code expected.
- **finish** — work already sits in the tree; run checks and commit it.

## How to cut

- Read the ticket, the findings file if any, and the named file. Ten reads without a changed file means make the probe edit.
- Form the smallest theory of the change, and test that theory by editing. The compiler, tests, and generators answer faster than another tour.
- If the slice would touch more than the named seam, commit what is useful, write the question to a plain file, and stop.
- Triage unknowns: (1) a file the instruction names — read it; (2) make the edit and watch what breaks; (3) a genuine product decision — commit what is useful, write the precise question, stop. Most unknowns are type 2.
- Repository archaeology — reading to feel oriented — is the anti-pattern. Return to the seam.
- Checkpoint as if the turn could end now. Commit the first coherent vertical piece before widening. Exploration must leave residue in a notes file.
- Never edit `spec/build.md`, ticket status, or outcome files. Progress lives in the commit and the final message. Do not plan or reprioritize the wider project.
- A referenced spec path that does not exist is a handoff defect: say so, proceed from the instruction, and do not hunt for a replacement ticket.

## Checks

Name the acceptance line most likely to be false and run that check. Report real output. Full native lane (`npm run check`) once at the clean candidate commit, after committing. No repo-wide formatter over untouched files.

## Final message

Changes, checks actually run, commit(s), what the next worker must know, and any remaining slice.
