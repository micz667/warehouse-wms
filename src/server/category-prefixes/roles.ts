import type { Role } from "@prisma/client";

/** Prefix registry is admin-only. */
export const CATEGORY_PREFIX_ADMIN_ROLES = ["admin"] as const satisfies readonly Role[];
