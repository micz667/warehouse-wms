import type { Movement, PrismaClient } from "@prisma/client";
import { parsePositiveQty } from "./parse-positive-qty";

export type PostReceiptInput = {
  catalogItemId: string;
  locationId: string;
  qty: unknown;
  createdById?: string | null;
};

export type PostReceiptResult =
  | { ok: true; movement: Movement }
  | {
      ok: false;
      error: "validation" | "not_found";
      message: string;
    };

/** Receipt: +qty at destination. Stock = sum of movements. */
export async function postReceipt(
  db: PrismaClient,
  input: PostReceiptInput,
): Promise<PostReceiptResult> {
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
