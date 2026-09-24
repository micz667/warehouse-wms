import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { listRecentMovements } from "@/server/movements/list-recent-movements";
import { movementListRequiresAudit } from "@/server/movements/movement-list-requires-audit";
import {
  MOVEMENT_AUDIT_ROLES,
  MOVEMENT_READ_ROLES,
} from "@/server/movements/roles";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const catalogItemId = url.searchParams.get("catalogItemId");
  const locationId = url.searchParams.get("locationId");
  const createdById = url.searchParams.get("createdById");

  const filtered = movementListRequiresAudit({
    from,
    to,
    catalogItemId,
    locationId,
    createdById,
  });

  const gate = gateRole(
    session?.user?.role,
    filtered ? MOVEMENT_AUDIT_ROLES : MOVEMENT_READ_ROLES,
  );
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  const takeRaw = url.searchParams.get("take");
  const take = takeRaw ? Number(takeRaw) : undefined;

  const movements = await listRecentMovements(prisma, {
    take: Number.isFinite(take) ? take : undefined,
    from,
    to,
    catalogItemId,
    locationId,
    createdById,
  });

  return Response.json({
    movements: movements.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
