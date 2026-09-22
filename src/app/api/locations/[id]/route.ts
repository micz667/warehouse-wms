import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  LOCATION_READ_ROLES,
  LOCATION_WRITE_ROLES,
} from "@/server/locations/roles";
import { updateLocation } from "@/server/locations/update-location";
import { gateRole } from "@/server/gate-role";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, LOCATION_READ_ROLES);
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
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) {
    return Response.json({ error: "Lokalizacja nie istnieje" }, { status: 404 });
  }
  return Response.json({ location });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, LOCATION_WRITE_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const { id } = await context.params;
  const result = await updateLocation(prisma, id, {
    code: typeof record.code === "string" ? record.code : undefined,
    label: typeof record.label === "string" ? record.label : undefined,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "code_taken"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ location: result.location });
}
