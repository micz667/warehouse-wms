import type { PrismaClient } from "@prisma/client";

export type CategoryPrefixListRow = {
  id: string;
  category: string;
  prefix: string;
  nextNumber: number;
  itemCount: number;
  prefixEditable: boolean;
};

/** List registry rows with item counts (items whose barcode uses the prefix). */
export async function listCategoryPrefixes(
  db: PrismaClient,
): Promise<CategoryPrefixListRow[]> {
  const rows = await db.categoryPrefix.findMany({
    orderBy: [{ category: "asc" }],
  });

  const counts = await Promise.all(
    rows.map((row) =>
      db.catalogItem.count({
        where: { barcode: { startsWith: `${row.prefix}-` } },
      }),
    ),
  );

  return rows.map((row, i) => {
    const itemCount = counts[i] ?? 0;
    return {
      id: row.id,
      category: row.category,
      prefix: row.prefix,
      nextNumber: row.nextNumber,
      itemCount,
      prefixEditable: itemCount === 0,
    };
  });
}
