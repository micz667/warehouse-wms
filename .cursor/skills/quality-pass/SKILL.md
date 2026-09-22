---
name: quality-pass
description: Reads the vision and styleguide, then a stretch of landed work, and writes one findings file under spec/quality/. Use after about ten proven landings, when the owner asks for a quality pass, or when hunting dead code and split authority. Does not rewrite the tree and is not a merge gate.
---

# Quality pass

Judge landed work against `spec/vision.md` and `.agents/limen/styleguide.md`. Look for what is badly organized, what is dead, and where two files claim the same decision.

The bar is subtraction and unification. A rewrite is out of scope. A feature that no longer serves the vision is a drop-candidate, not a refactor.

## Write

`spec/quality/YYYY-MM.md`. If that path exists, write `YYYY-MM-2.md`, then `-3`. Never overwrite a findings file.

Each finding is a drop-candidate, a proposed ticket line, or one small slice. Those are the only outputs.

The handoff names the stretch. If it does not, start from the last `spec/quality/` file, or the board's PROVEN window.

Commit the findings file. Change no other file. Do not edit the board, open tickets, merge, or change the vision or the styleguide. The coordinator turns findings into planned tickets; this pass does not.

The first line of the final message is the findings path.
