import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { listItemLocations } from "@/server/stock/list-item-locations";
import { STOCK_READ_ROLES } from "@/server/stocktake/roles";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, STOCK_READ_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  const { id } = await context.params;
  const result = await listItemLocations(prisma, id);
  if (!result.ok) {
    return Response.json(
      { error: "Nie znaleziono pozycji katalogu" },
      { status: 404 },
    );
  }

  return Response.json({
    item: result.item,
    locations: result.locations,
    total: result.total,
  });
}
