import type { Role } from "@prisma/client";

/** Magazynier and admin prepare cafe shipments (same as issue write). */
export const CAFE_ISSUE_WRITE_ROLES = [
  "magazynier",
  "admin",
] as const satisfies readonly Role[];

/** Magazynier and admin list / reopen prepared cafe issues. */
export const CAFE_ISSUE_READ_ROLES = [
  "magazynier",
  "admin",
] as const satisfies readonly Role[];
