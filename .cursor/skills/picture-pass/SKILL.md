---
name: picture-pass
description: Rewrites spec/picture.md when a system shape moved. Use after a merge that changes a job kind, a role, a process boundary, or where truth lives, and only when the handoff names that shape in one clause. Prompt wording, tests, bugfixes, and ordinary slices are not a picture.
---

# Picture pass

Rewrite `spec/picture.md` and nothing else. No dated diagram beside it, no per-merge file.

The coordinator named, in one clause in the handoff, the shape that moved. If that clause is missing, stop and say so — do not invent a shape.

## Rules

- Read the board, the feature folders, and Git. Never invent state. A missing board line, folder, or commit is a gap you name, not a blank you fill.
- Hold the human register: nothing bare, nothing that needs this thread to make sense. Text-first — prose, and a fenced diagram only when a picture settles a structure. Readable in one sitting.
- Do not edit the board, tickets, or outcome files. Do not open tickets.
- Commit the rewrite.

The final message says what the picture now shows and the commit, and names what you did not invent.
