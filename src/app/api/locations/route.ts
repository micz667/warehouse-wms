import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createLocation } from "@/server/locations/create-location";
import { listLocations } from "@/server/locations/list-locations";
import {
  LOCATION_READ_ROLES,
  LOCATION_WRITE_ROLES,
} from "@/server/locations/roles";
import { gateRole } from "@/server/gate-role";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const renovationOnly =
    searchParams.get("renovation") === "1" ||
    searchParams.get("renovation") === "true";
  const locations = await listLocations(prisma, { query: q, renovationOnly });
  return Response.json({ locations });
}

export async function POST(request: Request) {
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
  const result = await createLocation(prisma, {
    code: typeof record.code === "string" ? record.code : "",
    label: typeof record.label === "string" ? record.label : "",
    isRenovation: record.isRenovation === true,
  });

  if (!result.ok) {
    const status =
      result.error === "validation"
        ? 400
        : result.error === "code_taken"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ location: result.location }, { status: 201 });
}
