import type { Movement, PrismaClient } from "@prisma/client";
import { parsePositiveQty } from "./parse-positive-qty";
import { lockStockKeys } from "@/server/stock/lock-stock-keys";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export type PostIssueInput = {
  catalogItemId: string;
  locationId: string;
  qty: unknown;
  createdById?: string | null;
};

export type PostIssueResult =
  | { ok: true; movement: Movement }
  | {
      ok: false;
      error: "validation" | "not_found" | "insufficient_stock";
      message: string;
    };

/**
 * Issue: −qty at source.
 * Rule (MVP): refuse when balance − qty would be negative at that location.
 * No overdraw; product may loosen later.
 */
export async function postIssue(
  db: PrismaClient,
  input: PostIssueInput,
): Promise<PostIssueResult> {
  const parsed = parsePositiveQty(input.qty);
  if (!parsed.ok) {
    return { ok: false, error: "validation", message: parsed.message };
  }

  return db.$transaction(async (tx) => {
    const [item, location] = await Promise.all([
      tx.catalogItem.findUnique({ where: { id: input.catalogItemId } }),
      tx.location.findUnique({ where: { id: input.locationId } }),
    ]);
    if (!item) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono pozycji katalogu",
      };
    }
    if (!location) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono lokalizacji",
      };
    }

    await lockStockKeys(tx, [
      { catalogItemId: item.id, locationId: location.id },
    ]);

    const balance = await sumMovementQty(tx, {
      catalogItemId: item.id,
      locationId: location.id,
    });
    if (balance.lt(parsed.qty)) {
      return {
        ok: false as const,
        error: "insufficient_stock" as const,
        message: `Brak stanu: dostępne ${balance.toString()}, żądane ${parsed.qty.toString()}`,
      };
    }

    const movement = await tx.movement.create({
      data: {
        type: "issue",
        catalogItemId: item.id,
        locationId: location.id,
        qty: parsed.qty.neg(),
        createdById: input.createdById ?? null,
      },
    });

    return { ok: true as const, movement };
  });
}
