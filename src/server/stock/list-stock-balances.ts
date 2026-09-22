import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { sumMovementQty } from "./sum-movement-qty";

export type StockBalance = {
  catalogItemId: string;
  locationId: string;
  qty: string;
  itemSku: string;
  itemName: string;
  itemUnit: string;
  locationCode: string;
  locationLabel: string;
};

/**
 * On-hand qty for one item × location = sum of movements.
 * Delegates to `sumMovementQty` — the sole stock read path (F006).
 */
export async function getStockBalance(
  db: PrismaClient,
  catalogItemId: string,
  locationId: string,
): Promise<Decimal> {
  return sumMovementQty(db, { catalogItemId, locationId });
}

/** Item total across all locations = sum of movements for that item. */
export async function getItemStockTotal(
  db: PrismaClient,
  catalogItemId: string,
): Promise<Decimal> {
  return sumMovementQty(db, { catalogItemId });
}

/**
 * List balances by item × location from movement group sums.
 * Same SUM semantics as `sumMovementQty` / `getStockBalance`.
 */
export async function listStockBalances(
  db: PrismaClient,
): Promise<StockBalance[]> {
  const grouped = await db.movement.groupBy({
    by: ["catalogItemId", "locationId"],
    _sum: { qty: true },
  });

  if (grouped.length === 0) return [];

  const itemIds = [...new Set(grouped.map((g) => g.catalogItemId))];
  const locationIds = [...new Set(grouped.map((g) => g.locationId))];

  const [items, locations] = await Promise.all([
    db.catalogItem.findMany({ where: { id: { in: itemIds } } }),
    db.location.findMany({ where: { id: { in: locationIds } } }),
  ]);

  const itemById = new Map(items.map((i) => [i.id, i]));
  const locById = new Map(locations.map((l) => [l.id, l]));

  const balances: StockBalance[] = [];
  for (const row of grouped) {
    const item = itemById.get(row.catalogItemId);
    const loc = locById.get(row.locationId);
    if (!item || !loc) continue;
    const sum = row._sum.qty ?? new Decimal(0);
    balances.push({
      catalogItemId: row.catalogItemId,
      locationId: row.locationId,
      qty: sum.toString(),
      itemSku: item.sku,
      itemName: item.name,
      itemUnit: item.unit,
      locationCode: loc.code,
      locationLabel: loc.label,
    });
  }

  balances.sort((a, b) => {
    const byLoc = a.locationCode.localeCompare(b.locationCode);
    if (byLoc !== 0) return byLoc;
    return a.itemSku.localeCompare(b.itemSku);
  });

  return balances;
}
