import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { postCorrection } from "@/server/movements/post-correction";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";

type Body = {
  movementId?: string;
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

  if (!body.movementId || typeof body.movementId !== "string") {
    return Response.json({ error: "Wymagane: movementId" }, { status: 400 });
  }

  const result = await postCorrection(prisma, {
    movementId: body.movementId,
    createdById: session?.user?.id ?? null,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "insufficient_stock"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({
    movement: {
      ...result.movement,
      qty: result.movement.qty.toString(),
      createdAt: result.movement.createdAt.toISOString(),
    },
    original: {
      id: result.original.id,
      type: result.original.type,
      qty: result.original.qty.toString(),
    },
  });
}
