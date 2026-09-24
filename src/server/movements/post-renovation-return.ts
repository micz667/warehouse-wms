import type { Movement, PrismaClient } from "@prisma/client";
import { parsePositiveQty } from "./parse-positive-qty";

export type PostRenovationReturnInput = {
  catalogItemId: string;
  locationId: string;
  qty: unknown;
  createdById?: string | null;
};

export type PostRenovationReturnResult =
  | { ok: true; movement: Movement }
  | {
      ok: false;
      error: "validation" | "not_found" | "not_renovation";
      message: string;
    };

/**
 * Return → renovation (F016): +qty receipt at a renovation-section location.
 * Stock stays SUM(movements); renovation is a Location flag, not a ledger.
 */
export async function postRenovationReturn(
  db: PrismaClient,
  input: PostRenovationReturnInput,
): Promise<PostRenovationReturnResult> {
  const parsed = parsePositiveQty(input.qty);
  if (!parsed.ok) {
    return { ok: false, error: "validation", message: parsed.message };
  }

  const [item, location] = await Promise.all([
    db.catalogItem.findUnique({ where: { id: input.catalogItemId } }),
    db.location.findUnique({ where: { id: input.locationId } }),
  ]);
  if (!item) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono pozycji katalogu",
    };
  }
  if (!location) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono lokalizacji",
    };
  }
  if (!location.isRenovation) {
    return {
      ok: false,
      error: "not_renovation",
      message: "Wybierz lokalizację sekcji renowacji",
    };
  }

  const movement = await db.movement.create({
    data: {
      type: "receipt",
      catalogItemId: item.id,
      locationId: location.id,
      qty: parsed.qty,
      createdById: input.createdById ?? null,
    },
  });

  return { ok: true, movement };
}
