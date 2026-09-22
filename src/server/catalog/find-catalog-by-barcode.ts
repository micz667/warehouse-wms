import type { CatalogItem, PrismaClient } from "@prisma/client";

/** Exact barcode match after trim — camera scan and typed fallback. */
export async function findCatalogByBarcode(
  db: PrismaClient,
  rawBarcode: string,
): Promise<CatalogItem | null> {
  const barcode = rawBarcode.trim();
  if (!barcode) return null;
  return db.catalogItem.findUnique({ where: { barcode } });
}
