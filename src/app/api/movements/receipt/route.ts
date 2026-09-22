import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { postReceipt } from "@/server/movements/post-receipt";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";

type Body = {
  catalogItemId?: string;
  locationId?: string;
  qty?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, MOVEMENT_WRITE_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Nieprawidłowe ciało żądania" }, { status: 400 });
  }

  if (!body.catalogItemId || !body.locationId) {
    return Response.json(
      { error: "Wymagane: catalogItemId i locationId" },
      { status: 400 },
    );
  }

  const result = await postReceipt(prisma, {
    catalogItemId: body.catalogItemId,
    locationId: body.locationId,
    qty: body.qty,
    createdById: session?.user?.id ?? null,
  });

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({
    movement: {
      ...result.movement,
      qty: result.movement.qty.toString(),
      createdAt: result.movement.createdAt.toISOString(),
    },
  });
}
