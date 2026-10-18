import type { PrismaClient } from "@prisma/client";
import {
  FALLBACK_CATEGORY,
  FALLBACK_PREFIX,
  PREFIX_PATTERN,
} from "./constants";
import { loadPrefixCsv } from "./load-prefix-csv";
import { normalizePrefixLetters } from "./normalize-prefix";

/**
 * Upsert registry rows from the reviewable CSV (idempotent).
 * Does not reset `nextNumber` on existing rows.
 */
export async function ensureCategoryPrefixesFromCsv(
  db: PrismaClient,
): Promise<{ upserted: number }> {
  const rows = loadPrefixCsv();
  let upserted = 0;
  for (const row of rows) {
    const prefix = normalizePrefixLetters(row.prefix);
    if (!PREFIX_PATTERN.test(prefix) || !row.category) continue;
    await db.categoryPrefix.upsert({
      where: { category: row.category },
      create: {
        category: row.category,
        prefix,
        nextNumber: 1,
      },
      update: {
        // Keep nextNumber; allow correcting prefix only when unused — seed
        // does not change prefix if a different one is already stored.
      },
    });
    // If row is new, done. If existing with different prefix and still unused
    // (nextNumber === 1 and no items), align prefix to CSV.
    const existing = await db.categoryPrefix.findUnique({
      where: { category: row.category },
    });
    if (
      existing &&
      existing.prefix !== prefix &&
      existing.nextNumber === 1
    ) {
      const inUse = await db.catalogItem.count({
        where: { barcode: { startsWith: `${existing.prefix}-` } },
      });
      if (inUse === 0) {
        const taken = await db.categoryPrefix.findUnique({
          where: { prefix },
        });
        if (!taken || taken.id === existing.id) {
          await db.categoryPrefix.update({
            where: { id: existing.id },
            data: { prefix },
          });
        }
      }
    }
    upserted++;
  }

  await db.categoryPrefix.upsert({
    where: { category: FALLBACK_CATEGORY },
    create: {
      category: FALLBACK_CATEGORY,
      prefix: FALLBACK_PREFIX,
      nextNumber: 1,
    },
    update: {},
  });

  return { upserted };
}
