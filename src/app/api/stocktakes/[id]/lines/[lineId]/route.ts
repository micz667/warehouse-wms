import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { deleteStocktakeLine } from "@/server/stocktake/delete-stocktake-line";
import { STOCKTAKE_WRITE_ROLES } from "@/server/stocktake/roles";

type Params = { params: Promise<{ id: string; lineId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, STOCKTAKE_WRITE_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  const { id, lineId } = await params;
  const line = await prisma.stocktakeLine.findUnique({
    where: { id: lineId },
  });
  if (!line || line.sessionId !== id) {
    return Response.json(
      { error: "Nie znaleziono pozycji spisu" },
      { status: 404 },
    );
  }

  const result = await deleteStocktakeLine(prisma, lineId);
  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "invalid_status"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ ok: true });
}
