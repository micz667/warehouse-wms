import type { PrismaClient, StocktakeSession } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export type ApproveStocktakeResult =
  | {
      ok: true;
      session: StocktakeSession;
      movementCount: number;
    }
  | {
      ok: false;
      error: "not_found" | "invalid_status" | "empty" | "already_approved";
      message: string;
    };

/**
 * Approve a counting session in one transaction:
 * - opening (F005): post an opening movement per line (= counted qty)
 * - inventory (F017): post a correction movement per line with non-zero
 *   variance (counted − system SUM(movements))
 * Re-approve is blocked (no double post).
 */
export async function approveStocktakeSession(
  db: PrismaClient,
  sessionId: string,
  options: { createdById?: string | null } = {},
): Promise<ApproveStocktakeResult> {
  return db.$transaction(async (tx) => {
    const session = await tx.stocktakeSession.findUnique({
      where: { id: sessionId },
      include: { lines: true },
    });

    if (!session) {
      return {
        ok: false,
        error: "not_found",
        message: "Nie znaleziono sesji spisu",
      };
    }

    if (session.status === "approved") {
      return {
        ok: false,
        error: "already_approved",
        message: "Spis jest już zatwierdzony — ponowne zatwierdzenie zablokowane",
      };
    }

    if (session.status !== "counting") {
      return {
        ok: false,
        error: "invalid_status",
        message: "Zatwierdzić można tylko sesję w trakcie liczenia",
      };
    }

    if (session.lines.length === 0) {
      return {
        ok: false,
        error: "empty",
        message: "Nie można zatwierdzić pustego spisu",
      };
    }

    let movementCount = 0;

    if (session.kind === "inventory") {
      for (const line of session.lines) {
        const systemQty = await sumMovementQty(tx, {
          catalogItemId: line.catalogItemId,
          locationId: line.locationId,
        });
        const variance = new Decimal(line.countedQty.toString()).minus(
          systemQty,
        );
        if (variance.isZero()) continue;

        await tx.movement.create({
          data: {
            type: "correction",
            catalogItemId: line.catalogItemId,
            locationId: line.locationId,
            qty: variance,
            stocktakeSessionId: session.id,
            stocktakeLineId: line.id,
            createdById: options.createdById ?? null,
          },
        });
        movementCount += 1;
      }
    } else {
      for (const line of session.lines) {
        await tx.movement.create({
          data: {
            type: "opening",
            catalogItemId: line.catalogItemId,
            locationId: line.locationId,
            qty: line.countedQty,
            stocktakeSessionId: session.id,
            stocktakeLineId: line.id,
            createdById: options.createdById ?? null,
          },
        });
      }
      movementCount = session.lines.length;
    }

    const updated = await tx.stocktakeSession.update({
      where: { id: session.id },
      data: {
        status: "approved",
        approvedAt: new Date(),
      },
    });

    return {
      ok: true,
      session: updated,
      movementCount,
    };
  });
}
