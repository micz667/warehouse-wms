import type { Movement, PrismaClient } from "@prisma/client";
import { lockStockKeys } from "@/server/stock/lock-stock-keys";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export type PostCorrectionInput = {
  movementId: string;
  createdById?: string | null;
};

export type PostCorrectionResult =
  | { ok: true; movement: Movement; original: Movement }
  | {
      ok: false;
      error:
        | "not_found"
        | "already_corrected"
        | "is_correction"
        | "insufficient_stock";
      message: string;
    };

/**
 * Storno: append an opposite movement for a mistaken row (F015).
 * Original row is never mutated or deleted. Stock = sum of all rows.
 * Refuses a second correction of the same original, correcting a correction
 * (correct the new balance with another hall movement if needed), and
 * overdraw when the opposite qty would make the location balance negative.
 */
export async function postCorrection(
  db: PrismaClient,
  input: PostCorrectionInput,
): Promise<PostCorrectionResult> {
  const movementId = input.movementId.trim();
  if (!movementId) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono ruchu",
    };
  }

  return db.$transaction(async (tx) => {
    const original = await tx.movement.findUnique({
      where: { id: movementId },
      include: { correctedBy: { select: { id: true } } },
    });
    if (!original) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono ruchu",
      };
    }
    if (original.type === "correction" || original.correctsMovementId) {
      return {
        ok: false as const,
        error: "is_correction" as const,
        message: "Nie można korygować już zapisanej korekty — wybierz pierwotny ruch",
      };
    }
    if (original.correctedBy) {
      return {
        ok: false as const,
        error: "already_corrected" as const,
        message: "Ten ruch ma już korektę (storno)",
      };
    }

    await lockStockKeys(tx, [
      {
        catalogItemId: original.catalogItemId,
        locationId: original.locationId,
      },
    ]);

    const oppositeQty = original.qty.neg();
    if (oppositeQty.isNegative()) {
      const balance = await sumMovementQty(tx, {
        catalogItemId: original.catalogItemId,
        locationId: original.locationId,
      });
      const magnitude = oppositeQty.abs();
      if (balance.lt(magnitude)) {
        return {
          ok: false as const,
          error: "insufficient_stock" as const,
          message: `Brak stanu do korekty: dostępne ${balance.toString()}, wymagane ${magnitude.toString()}`,
        };
      }
    }

    const movement = await tx.movement.create({
      data: {
        type: "correction",
        catalogItemId: original.catalogItemId,
        locationId: original.locationId,
        qty: oppositeQty,
        correctsMovementId: original.id,
        createdById: input.createdById ?? null,
      },
    });

    return { ok: true as const, movement, original };
  });
}
