import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

export type StockLockKey = {
  catalogItemId: string;
  locationId: string;
};

/**
 * Transaction-scoped advisory locks for (catalogItemId, locationId) pairs.
 * Call inside `$transaction` before any balance read that gates a stock write.
 * Keys are locked in deterministic sort order to avoid deadlocks across writers.
 */
export async function lockStockKeys(
  tx: Prisma.TransactionClient,
  keys: StockLockKey[],
): Promise<void> {
  const unique = new Map<string, StockLockKey>();
  for (const key of keys) {
    const id = `${key.catalogItemId}\0${key.locationId}`;
    if (!unique.has(id)) unique.set(id, key);
  }

  const ordered = [...unique.values()].sort((a, b) => {
    const byItem = a.catalogItemId.localeCompare(b.catalogItemId);
    if (byItem !== 0) return byItem;
    return a.locationId.localeCompare(b.locationId);
  });

  for (const key of ordered) {
    const [k1, k2] = stockLockIntPair(key.catalogItemId, key.locationId);
    // Prisma parameterizes JS numbers as bigint; pg wants int4 for the 2-arg form.
    await tx.$executeRawUnsafe(
      "SELECT pg_advisory_xact_lock($1::int4, $2::int4)",
      k1,
      k2,
    );
  }
}

/** Stable int4 pair for pg_advisory_xact_lock(key1, key2). */
export function stockLockIntPair(
  catalogItemId: string,
  locationId: string,
): [number, number] {
  const digest = createHash("sha256")
    .update(catalogItemId)
    .update("\0")
    .update(locationId)
    .digest();
  return [digest.readInt32BE(0), digest.readInt32BE(4)];
}
