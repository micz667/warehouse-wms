import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { listRecentMovements } from "@/server/movements/list-recent-movements";
import {
  MOVEMENT_AUDIT_ROLES,
  MOVEMENT_READ_ROLES,
} from "@/server/movements/roles";

function hasAuditFilters(url: URL): boolean {
  return (
    url.searchParams.has("from") ||
    url.searchParams.has("to") ||
    url.searchParams.has("catalogItemId") ||
    url.searchParams.has("locationId") ||
    url.searchParams.has("createdById")
  );
}

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const filtered = hasAuditFilters(url);

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
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    catalogItemId: url.searchParams.get("catalogItemId"),
    locationId: url.searchParams.get("locationId"),
    createdById: url.searchParams.get("createdById"),
  });

  return Response.json({
    movements: movements.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
