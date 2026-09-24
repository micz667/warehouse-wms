# F018 · Emergency issue without signature

## Outcome

When cafe signature is impossible, a warehouse user can consciously issue without signature; the bypass is logged so stock still leaves under a clear emergency record.

## Scope

- Explicit “issue without signature” action on a prepared cafe issue document from F013 (or equivalent emergency path).
- Posts issue movements and records that signature was skipped, with actor and reason/note — bypassing the F013b signature step.

## Out of scope

- Removing the normal signature path (F013 prepare + F013b signature remain the default).
- Silent auto-issue without confirmation.
- Building the prepare package itself (F013).

## Acceptance

- Choosing emergency issue without signature requires a conscious confirmation (not a single accidental tap on the normal prepare action).
- After confirm, warehouse stock decreases and the document is no longer left in prepared/in-transit awaiting signature.
- History or the document shows the issue was completed without signature, with actor and timestamp (and reason/note if captured).
- The normal signed path (F013 prepare then F013b signature) still works and remains the default hall/cafe flow.

## Notes

- Emergency only; default remains F013 prepared package until F013b finger signature, then stock leaves. F018 bypasses F013b on an already prepared F013 document.
