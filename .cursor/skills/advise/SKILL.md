---
name: advise
description: Answers one product or interface question with a recommendation and the tradeoff it costs. Use when the question is what to build rather than whether a branch is correct — interface shape, feature specification, or a second read on a decision. Writes no code, commits, or board edits. Not a substitute for review of a candidate.
---

# Advise

Value is the recommendation and the tradeoff it costs, not a survey of the options. A perspective with no tradeoff is a preference.

- Read what the question names: the ticket, the vision, the styleguide, the files at issue. Run the product and look at it when the question is about interface rather than implementation.
- Say which claims you checked and which you are guessing. A guess named as a guess is useful; a guess dressed as a finding is not.
- Write nothing: no code, no commit, no branch, no board edit, no ticket-status change. Do not plan or reprioritize the wider project.
- Do not reach for this to second-guess an ordinary slice — that is review.

File the final message as `advice-N.md` in the feature folder, or in `spec/research/<slug>/` when the question has no feature yet. The coordinator files; this pass does not write the file unless asked to.

The final message stands alone: the recommendation first, then the tradeoff, then the one thing you would check next.
