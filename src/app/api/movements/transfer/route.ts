import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { postTransfer } from "@/server/movements/post-transfer";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";

type Body = {
  catalogItemId?: string;
  fromLocationId?: string;
  toLocationId?: string;
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

  if (!body.catalogItemId || !body.fromLocationId || !body.toLocationId) {
    return Response.json(
      {
        error: "Wymagane: catalogItemId, fromLocationId i toLocationId",
      },
      { status: 400 },
    );
  }

  const result = await postTransfer(prisma, {
    catalogItemId: body.catalogItemId,
    fromLocationId: body.fromLocationId,
    toLocationId: body.toLocationId,
    qty: body.qty,
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
    from: {
      ...result.from,
      qty: result.from.qty.toString(),
      createdAt: result.from.createdAt.toISOString(),
    },
    to: {
      ...result.to,
      qty: result.to.qty.toString(),
      createdAt: result.to.createdAt.toISOString(),
    },
  });
}
