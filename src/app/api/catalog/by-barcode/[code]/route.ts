import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findCatalogByBarcode } from "@/server/catalog/find-catalog-by-barcode";
import { CATALOG_READ_ROLES } from "@/server/catalog/roles";
import { gateRole } from "@/server/gate-role";

type RouteContext = { params: Promise<{ code: string }> };

/** Exact barcode lookup for hall scan / typed fallback. */
export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, CATALOG_READ_ROLES);
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
  const item = await findCatalogByBarcode(
    prisma,
    decodeURIComponent(code),
  );
  if (!item) {
    return Response.json(
      { error: "Nie znaleziono pozycji o tym kodzie" },
      { status: 404 },
    );
  }
  return Response.json({ item });
}
