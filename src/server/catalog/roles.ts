import type { Role } from "@prisma/client";

/** Roles that may create/edit catalog items and upload photos. */
export const CATALOG_WRITE_ROLES = ["magazynier", "admin"] as const satisfies readonly Role[];

/** Any signed-in role may browse the catalog (architekt views for shopping lists later). */
export const CATALOG_READ_ROLES = [
  "magazynier",
  "architekt",
  "admin",
] as const satisfies readonly Role[];
