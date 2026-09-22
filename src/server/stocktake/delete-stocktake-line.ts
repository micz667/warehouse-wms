import type { PrismaClient } from "@prisma/client";

export type DeleteStocktakeLineResult =
  | { ok: true }
  | {
      ok: false;
      error: "not_found" | "invalid_status";
      message: string;
    };

export async function deleteStocktakeLine(
  db: PrismaClient,
  lineId: string,
): Promise<DeleteStocktakeLineResult> {
  const line = await db.stocktakeLine.findUnique({
    where: { id: lineId },
    include: { session: true },
  });
  if (!line) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono pozycji spisu",
    };
  }
  if (line.session.status === "approved") {
    return {
      ok: false,
      error: "invalid_status",
      message: "Zatwierdzony spis nie może być edytowany",
    };
  }

  await db.stocktakeLine.delete({ where: { id: lineId } });
  return { ok: true };
}
