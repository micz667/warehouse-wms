import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { approveStocktakeSession } from "@/server/stocktake/approve-stocktake-session";
import { STOCKTAKE_WRITE_ROLES } from "@/server/stocktake/roles";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
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

  const { id } = await params;
  const result = await approveStocktakeSession(prisma, id, {
    createdById: session?.user?.id ?? null,
  });
  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "already_approved" ||
            result.error === "opening_already_done" ||
            result.error === "invalid_status"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({
    session: result.session,
    movementCount: result.movementCount,
  });
}
