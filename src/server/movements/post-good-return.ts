import type { Movement, PrismaClient } from "@prisma/client";
import { parsePositiveQty } from "./parse-positive-qty";

export type PostGoodReturnInput = {
  catalogItemId: string;
  locationId: string;
  qty: unknown;
  createdById?: string | null;
};

export type PostGoodReturnResult =
  | { ok: true; movement: Movement }
  | {
      ok: false;
      error: "validation" | "not_found" | "not_shelf";
      message: string;
    };

/**
 * Good return (F016): +qty receipt onto a normal shelf location.
 * Refuses renovation-section destinations — those use postRenovationReturn.
 */
export async function postGoodReturn(
  db: PrismaClient,
  input: PostGoodReturnInput,
): Promise<PostGoodReturnResult> {
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
  if (location.isRenovation) {
    return {
      ok: false,
      error: "not_shelf",
      message:
        "Zwrot dobry trafia na półkę — wybierz lokalizację poza sekcją renowacji",
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
