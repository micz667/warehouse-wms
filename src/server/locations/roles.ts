import type { Role } from "@prisma/client";

/** Only admin defines locations (codes + labels). */
export const LOCATION_WRITE_ROLES = ["admin"] as const satisfies readonly Role[];

/** Hall and office may view / pick / scan a location for later movements. */
export const LOCATION_READ_ROLES = [
  "magazynier",
  "architekt",
  "admin",
] as const satisfies readonly Role[];
