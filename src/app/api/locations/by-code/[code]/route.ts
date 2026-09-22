import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findLocationByCode } from "@/server/locations/find-location-by-code";
import { LOCATION_READ_ROLES } from "@/server/locations/roles";
import { gateRole } from "@/server/gate-role";

type RouteContext = { params: Promise<{ code: string }> };

/** Lookup by typed or camera-scanned code — seam for F007 movement flows. */
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

  const { code } = await context.params;
  const location = await findLocationByCode(prisma, decodeURIComponent(code));
  if (!location) {
    return Response.json({ error: "Lokalizacja nie znaleziona" }, { status: 404 });
  }
  return Response.json({ location });
}
