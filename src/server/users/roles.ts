import type { Role } from "@prisma/client";

/** Admin-only user management (create + role change). */
export const USER_WRITE_ROLES = ["admin"] as const satisfies readonly Role[];

/** Admin-only user directory. */
export const USER_READ_ROLES = ["admin"] as const satisfies readonly Role[];

export const ALL_ROLES = [
  "magazynier",
  "architekt",
  "admin",
] as const satisfies readonly Role[];

export function isValidRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    (ALL_ROLES as readonly string[]).includes(value)
  );
}
