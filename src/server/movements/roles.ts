import type { Role } from "@prisma/client";

/** Magazynier and admin post receipt / transfer / issue. */
export const MOVEMENT_WRITE_ROLES = [
  "magazynier",
  "admin",
] as const satisfies readonly Role[];

/** Any signed-in role may view recent movement history. */
export const MOVEMENT_READ_ROLES = [
  "magazynier",
  "architekt",
  "admin",
] as const satisfies readonly Role[];

/** Admin-grade filtered movement audit (F009). */
export const MOVEMENT_AUDIT_ROLES = [
  "admin",
] as const satisfies readonly Role[];
