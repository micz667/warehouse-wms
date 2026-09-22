import type { Role } from "@prisma/client";

/** Magazynier and admin run / approve stocktake sessions. */
export const STOCKTAKE_WRITE_ROLES = [
  "magazynier",
  "admin",
] as const satisfies readonly Role[];

/** Any signed-in role may view sessions and opening balances. */
export const STOCKTAKE_READ_ROLES = [
  "magazynier",
  "architekt",
  "admin",
] as const satisfies readonly Role[];

/** Stock balances are readable by every signed-in role. */
export const STOCK_READ_ROLES = STOCKTAKE_READ_ROLES;
