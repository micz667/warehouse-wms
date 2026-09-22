import type { Role } from "@prisma/client";

/** Architect and admin create drafts and submit lists. */
export const SHOPPING_LIST_CREATE_ROLES = [
  "architekt",
  "admin",
] as const satisfies readonly Role[];

/** Magazynier and admin check off submitted lines / mark done. */
export const SHOPPING_LIST_FULFILL_ROLES = [
  "magazynier",
  "admin",
] as const satisfies readonly Role[];

/** Any signed-in role may open lists they are allowed to see in the UI. */
export const SHOPPING_LIST_READ_ROLES = [
  "magazynier",
  "architekt",
  "admin",
] as const satisfies readonly Role[];

/** Architect and admin see done / past submitted history. */
export const SHOPPING_LIST_HISTORY_ROLES = [
  "architekt",
  "admin",
] as const satisfies readonly Role[];
