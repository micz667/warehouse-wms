import type { CatalogItem, PrismaClient } from "@prisma/client";

/** Searchable catalog list — matches name, SKU, barcode, or category (case-insensitive). */
export async function listCatalogItems(
  db: PrismaClient,
  query?: string,
): Promise<CatalogItem[]> {
  const q = query?.trim();
  if (!q) {
    return db.catalogItem.findMany({
      orderBy: [{ name: "asc" }, { sku: "asc" }],
    });
  }

  return db.catalogItem.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        { externalBarcode: { contains: q, mode: "insensitive" } },
        { sourceRef: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ name: "asc" }, { sku: "asc" }],
  });
}
