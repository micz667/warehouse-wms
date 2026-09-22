import type { PrismaClient } from "@prisma/client";

export type RecentMovementRow = {
  id: string;
  type: string;
  qty: string;
  createdAt: Date;
  catalogItem: { id: string; sku: string; name: string; barcode: string };
  location: { id: string; code: string; label: string };
  createdBy: { id: string; email: string; name: string | null } | null;
};

/** Simple hall/admin history — actor + timestamp; full audit is F009. */
export async function listRecentMovements(
  db: PrismaClient,
  options: { take?: number } = {},
): Promise<RecentMovementRow[]> {
  const take = Math.min(Math.max(options.take ?? 50, 1), 200);
  const rows = await db.movement.findMany({
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
