import type { Movement, PrismaClient } from "@prisma/client";
import { parsePositiveQty } from "./parse-positive-qty";
import { lockStockKeys } from "@/server/stock/lock-stock-keys";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export type PostTransferInput = {
  catalogItemId: string;
  fromLocationId: string;
  toLocationId: string;
  qty: unknown;
  createdById?: string | null;
};

export type PostTransferResult =
  | { ok: true; from: Movement; to: Movement }
  | {
      ok: false;
      error: "validation" | "not_found" | "insufficient_stock";
      message: string;
    };

/**
 * Transfer as a paired pair of `transfer` rows (F006 contract):
 * −qty at source, +qty at destination, same catalog item, one transaction.
 * Source must have enough on-hand (same negative-stock rule as issue).
 */
export async function postTransfer(
  db: PrismaClient,
  input: PostTransferInput,
): Promise<PostTransferResult> {
  const parsed = parsePositiveQty(input.qty);
  if (!parsed.ok) {
    return { ok: false, error: "validation", message: parsed.message };
  }

  if (input.fromLocationId === input.toLocationId) {
    return {
      ok: false,
      error: "validation",
      message: "Lokalizacja źródłowa i docelowa muszą być różne",
    };
  }

  return db.$transaction(async (tx) => {
    const [item, fromLoc, toLoc] = await Promise.all([
      tx.catalogItem.findUnique({ where: { id: input.catalogItemId } }),
      tx.location.findUnique({ where: { id: input.fromLocationId } }),
      tx.location.findUnique({ where: { id: input.toLocationId } }),
    ]);
    if (!item) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono pozycji katalogu",
      };
    }
    if (!fromLoc) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono lokalizacji źródłowej",
      };
    }
    if (!toLoc) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono lokalizacji docelowej",
      };
    }

    // Lock source (balance-checked) and destination in sorted order.
    await lockStockKeys(tx, [
      { catalogItemId: item.id, locationId: fromLoc.id },
      { catalogItemId: item.id, locationId: toLoc.id },
    ]);

    const balance = await sumMovementQty(tx, {
      catalogItemId: item.id,
      locationId: fromLoc.id,
    });
    if (balance.lt(parsed.qty)) {
      return {
        ok: false as const,
        error: "insufficient_stock" as const,
        message: `Brak stanu w źródle: dostępne ${balance.toString()}, żądane ${parsed.qty.toString()}`,
      };
    }

    const createdById = input.createdById ?? null;
    const from = await tx.movement.create({
      data: {
        type: "transfer",
        catalogItemId: item.id,
        locationId: fromLoc.id,
        qty: parsed.qty.neg(),
        createdById,
      },
    });
    const to = await tx.movement.create({
      data: {
        type: "transfer",
        catalogItemId: item.id,
        locationId: toLoc.id,
        qty: parsed.qty,
        createdById,
      },
    });

    return { ok: true as const, from, to };
  });
}
