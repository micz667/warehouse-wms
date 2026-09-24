# F013b · Cafe signature and receipt

## Outcome

At the cafe, the recipient finger-signs receipt of a prepared package. Only then do issue movements post and warehouse stock decrease by the signed quantities.

## Scope

- Open a prepared cafe issue document on site; capture finger signature.
- On successful sign, post issue movements that leave warehouse stock; show signature actor and timestamp on the document or in movement history.
- Starting seam: prepared/in-transit cafe issue documents from hall prepare (F013).

## Out of scope

- Building the package on the hall (F013).
- Emergency issue without signature (F018).
- Returns and renovation.

## Acceptance

- Signing a prepared document posts issue movements and decreases warehouse stock by the signed quantities.
- Without a signature the document stays prepared/in-transit and stock still shows at the warehouse.
- Signature actor and timestamp are visible on the document or in movement history.
- Signing applies only to an existing prepared/in-transit cafe issue document from hall prepare.

## Notes

- Default cafe path is F013 prepare then F013b signature; F018 is the logged bypass of this signature step.
