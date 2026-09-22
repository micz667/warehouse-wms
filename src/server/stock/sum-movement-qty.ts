import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type MovementQtyFilter = {
  catalogItemId: string;
  /** When omitted, sums across every location for the item. */
  locationId?: string;
};

/**
 * Single stock read path: on-hand qty = SUM(Movement.qty) for the filter.
 * All stock displays and APIs must go through this (or list helpers that
 * use the same SUM semantics). Never a writable raw qty column.
 */
export async function sumMovementQty(
  db: PrismaClient,
  filter: MovementQtyFilter,
): Promise<Decimal> {
  const agg = await db.movement.aggregate({
    where: {
      catalogItemId: filter.catalogItemId,
      ...(filter.locationId ? { locationId: filter.locationId } : {}),
    },
    _sum: { qty: true },
  });
  return agg._sum.qty ?? new Decimal(0);
}
