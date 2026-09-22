import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATALOG_READ_ROLES, CATALOG_WRITE_ROLES } from "@/server/catalog/roles";
import { updateCatalogItem } from "@/server/catalog/update-catalog-item";
import { gateRole } from "@/server/gate-role";

type RouteContext = { params: Promise<{ id: string }> };

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

  const { id } = await context.params;
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) {
    return Response.json({ error: "Pozycja nie istnieje" }, { status: 404 });
  }
  return Response.json({ item });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, CATALOG_WRITE_ROLES);
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
  const result = await updateCatalogItem(prisma, id, {
    sku: typeof record.sku === "string" ? record.sku : undefined,
    name: typeof record.name === "string" ? record.name : undefined,
    category: typeof record.category === "string" ? record.category : undefined,
    unit: typeof record.unit === "string" ? record.unit : undefined,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "sku_taken"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ item: result.item });
}
