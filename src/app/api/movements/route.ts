import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { listRecentMovements } from "@/server/movements/list-recent-movements";
import { MOVEMENT_READ_ROLES } from "@/server/movements/roles";

export async function GET(request: Request) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, MOVEMENT_READ_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  const url = new URL(request.url);
  const takeRaw = url.searchParams.get("take");
  const take = takeRaw ? Number(takeRaw) : undefined;

  const movements = await listRecentMovements(prisma, {
    take: Number.isFinite(take) ? take : undefined,
  });

  return Response.json({
    movements: movements.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
