import type { CatalogItem, PrismaClient } from "@prisma/client";

/**
 * Exact barcode match after trim — warehouse Code128 (`barcode`) or
 * manufacturer/external barcode (`externalBarcode`). Camera scan and typed
 * fallback both use this (F011 / F020).
 */
export async function findCatalogByBarcode(
  db: PrismaClient,
  rawBarcode: string,
): Promise<CatalogItem | null> {
  const barcode = rawBarcode.trim();
  if (!barcode) return null;
  return db.catalogItem.findFirst({
    where: {
      OR: [{ barcode }, { externalBarcode: barcode }],
    },
  });
}
