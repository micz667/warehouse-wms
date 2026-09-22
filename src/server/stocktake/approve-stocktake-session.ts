import type { PrismaClient, StocktakeSession } from "@prisma/client";

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
 * post an opening movement per line, then lock the session as approved.
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
      movementCount: session.lines.length,
    };
  });
}
