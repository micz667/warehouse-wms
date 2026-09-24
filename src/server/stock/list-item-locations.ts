import type { CatalogItem, PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type ItemLocationBalance = {
  locationId: string;
  locationCode: string;
  locationLabel: string;
  qty: string;
};

export type ListItemLocationsResult =
  | {
      ok: true;
      item: Pick<
        CatalogItem,
        "id" | "sku" | "name" | "barcode" | "unit"
      >;
      locations: ItemLocationBalance[];
      total: string;
    }
  | { ok: false; error: "not_found" };

/**
 * Where-is lookup: locations that currently hold an item.
 * Qty = SUM(movements) per location; zero-balance locations are omitted
 * (they do not “hold” stock).
 */
export async function listItemLocations(
  db: PrismaClient,
  catalogItemId: string,
): Promise<ListItemLocationsResult> {
  const item = await db.catalogItem.findUnique({
    where: { id: catalogItemId },
  });
  if (!item) {
    return { ok: false, error: "not_found" };
  }

  const grouped = await db.movement.groupBy({
    by: ["locationId"],
    where: { catalogItemId: item.id },
    _sum: { qty: true },
  });

  const positive = grouped.filter((row) => {
    const sum = row._sum.qty ?? new Decimal(0);
    return sum.gt(0);
  });

  if (positive.length === 0) {
    return {
      ok: true,
      item: {
        id: item.id,
        sku: item.sku,
        name: item.name,
        barcode: item.barcode,
        unit: item.unit,
      },
      locations: [],
      total: "0",
    };
  }

  const locations = await db.location.findMany({
    where: { id: { in: positive.map((r) => r.locationId) } },
  });
  const locById = new Map(locations.map((l) => [l.id, l]));

  const balances: ItemLocationBalance[] = [];
  let total = new Decimal(0);
  for (const row of positive) {
    const loc = locById.get(row.locationId);
    if (!loc) continue;
    const sum = row._sum.qty ?? new Decimal(0);
    total = total.add(sum);
    balances.push({
      locationId: loc.id,
      locationCode: loc.code,
      locationLabel: loc.label,
      qty: sum.toString(),
    });
  }

  balances.sort((a, b) => a.locationCode.localeCompare(b.locationCode));

  return {
    ok: true,
    item: {
      id: item.id,
      sku: item.sku,
      name: item.name,
      barcode: item.barcode,
      unit: item.unit,
    },
    locations: balances,
    total: total.toString(),
  };
}
