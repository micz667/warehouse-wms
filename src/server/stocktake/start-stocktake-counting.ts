import type { PrismaClient, StocktakeSession } from "@prisma/client";

export type StartStocktakeCountingResult =
  | { ok: true; session: StocktakeSession }
  | {
      ok: false;
      error: "not_found" | "invalid_status";
      message: string;
    };

/** draft → counting. Approved sessions cannot restart. */
export async function startStocktakeCounting(
  db: PrismaClient,
  sessionId: string,
): Promise<StartStocktakeCountingResult> {
  const session = await db.stocktakeSession.findUnique({
    where: { id: sessionId },
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
      error: "invalid_status",
      message: "Zatwierdzony spis nie może być ponownie otwarty",
    };
  }
  if (session.status === "counting") {
    return { ok: true, session };
  }

  const updated = await db.stocktakeSession.update({
    where: { id: sessionId },
    data: { status: "counting" },
  });
  return { ok: true, session: updated };
}
