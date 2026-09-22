import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { getStocktakeSession } from "@/server/stocktake/list-stocktake-sessions";
import { STOCKTAKE_READ_ROLES } from "@/server/stocktake/roles";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, STOCKTAKE_READ_ROLES);
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
  const stocktake = await getStocktakeSession(prisma, id);
  if (!stocktake) {
    return Response.json({ error: "Nie znaleziono sesji spisu" }, { status: 404 });
  }

  return Response.json({ session: stocktake });
}
