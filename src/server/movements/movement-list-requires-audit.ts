/**
 * Whether GET /api/movements filters require admin audit roles (F009).
 * Solo catalogItemId is hall-readable product history (F014).
 */
export function movementListRequiresAudit(params: {
  from?: string | null;
  to?: string | null;
  catalogItemId?: string | null;
  locationId?: string | null;
  createdById?: string | null;
}): boolean {
  return (
    hasValue(params.from) ||
    hasValue(params.to) ||
    hasValue(params.locationId) ||
    hasValue(params.createdById)
  );
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
