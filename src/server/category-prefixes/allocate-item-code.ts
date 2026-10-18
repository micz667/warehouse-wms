import type { Prisma, PrismaClient } from "@prisma/client";
import {
  FALLBACK_CATEGORY,
  FALLBACK_PREFIX,
} from "./constants";
import { formatItemCode } from "./format-item-code";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Atomically allocate the next item code for a catalog category.
 * Locks the CategoryPrefix row via UPDATE … RETURNING.
 * Unknown / empty category uses the fallback (`Bez kategorii` / INN).
 *
 * Codes are immutable once assigned to a CatalogItem — callers must not
 * re-allocate when category later changes.
 */
export async function allocateItemCode(
  db: Db,
  category: string,
): Promise<string> {
  const cat = category.trim() || FALLBACK_CATEGORY;

  // Prefer a nested interactive transaction when we have the root client so
  // concurrent allocates serialize on the row update. When already inside a
  // transaction client, run the same SQL in place.
  if ("$transaction" in db) {
    return db.$transaction((tx) => allocateInTx(tx, cat));
  }
  return allocateInTx(db, cat);
}

async function allocateInTx(
  tx: Prisma.TransactionClient,
  category: string,
): Promise<string> {
  let row = await tx.categoryPrefix.findUnique({ where: { category } });
  if (!row) {
    row = await tx.categoryPrefix.findUnique({
      where: { category: FALLBACK_CATEGORY },
    });
    if (!row) {
      row = await tx.categoryPrefix.create({
        data: {
          category: FALLBACK_CATEGORY,
          prefix: FALLBACK_PREFIX,
          nextNumber: 1,
        },
      });
    }
  }

  const updated = await tx.$queryRaw<
    { prefix: string; assigned: number }[]
  >`
    UPDATE "CategoryPrefix"
    SET "nextNumber" = "nextNumber" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${row.id}
    RETURNING prefix, ("nextNumber" - 1)::int AS assigned
  `;

  const got = updated[0];
  if (!got) {
    throw new Error(`failed to allocate code for category ${category}`);
  }
  return formatItemCode(got.prefix, got.assigned);
}
