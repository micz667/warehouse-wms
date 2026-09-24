import type { Prisma, PrismaClient } from "@prisma/client";

export type RecentMovementRow = {
  id: string;
  type: string;
  qty: string;
  createdAt: Date;
  catalogItem: { id: string; sku: string; name: string; barcode: string };
  location: { id: string; code: string; label: string };
  createdBy: { id: string; email: string; name: string | null } | null;
};

export type ListMovementsFilters = {
  take?: number;
  /** Inclusive lower bound on createdAt (ISO or Date). */
  from?: Date | string | null;
  /** Inclusive upper bound on createdAt (ISO or Date). */
  to?: Date | string | null;
  catalogItemId?: string | null;
  locationId?: string | null;
  createdById?: string | null;
};

function parseBound(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function trimId(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Movement history from the single Movement ledger.
 * Optional filters narrow by date range, item, location, actor (F009).
 * Product-only catalogItemId is hall history (F014); audit auth is separate.
 */
export async function listRecentMovements(
  db: PrismaClient,
  options: ListMovementsFilters = {},
): Promise<RecentMovementRow[]> {
  const take = Math.min(Math.max(options.take ?? 50, 1), 200);
  const from = parseBound(options.from);
  const to = parseBound(options.to);
  const catalogItemId = trimId(options.catalogItemId ?? undefined);
  const locationId = trimId(options.locationId ?? undefined);
  const createdById = trimId(options.createdById ?? undefined);

  const where: Prisma.MovementWhereInput = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }
  if (catalogItemId) where.catalogItemId = catalogItemId;
  if (locationId) where.locationId = locationId;
  if (createdById) where.createdById = createdById;

  const rows = await db.movement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      catalogItem: {
        select: { id: true, sku: true, name: true, barcode: true },
      },
      location: { select: { id: true, code: true, label: true } },
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    qty: row.qty.toString(),
    createdAt: row.createdAt,
    catalogItem: row.catalogItem,
    location: row.location,
    createdBy: row.createdBy,
  }));
}
