import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { createStocktakeSession } from "@/server/stocktake/create-stocktake-session";
import { listStocktakeSessions } from "@/server/stocktake/list-stocktake-sessions";
import {
  STOCKTAKE_READ_ROLES,
  STOCKTAKE_WRITE_ROLES,
} from "@/server/stocktake/roles";

export async function GET() {
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

  const sessions = await listStocktakeSessions(prisma);
  return Response.json({ sessions });
}

export async function POST(request: Request) {
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

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const result = await createStocktakeSession(prisma, {
    note: typeof record.note === "string" ? record.note : null,
    createdById: session?.user?.id ?? null,
  });

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  return Response.json({ session: result.session }, { status: 201 });
}
