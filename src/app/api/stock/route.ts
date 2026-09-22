import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { listStockBalances } from "@/server/stock/list-stock-balances";
import { STOCK_READ_ROLES } from "@/server/stocktake/roles";

export async function GET() {
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

  const balances = await listStockBalances(prisma);
  return Response.json({ balances });
}
