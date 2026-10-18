import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCatalogItem } from "@/server/catalog/create-catalog-item";
import { listCatalogItems } from "@/server/catalog/list-catalog-items";
import { CATALOG_READ_ROLES, CATALOG_WRITE_ROLES } from "@/server/catalog/roles";
import { gateRole } from "@/server/gate-role";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const items = await listCatalogItems(prisma, q);
  return Response.json({ items });
}

export async function POST(request: Request) {
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
  const result = await createCatalogItem(prisma, {
    name: typeof record.name === "string" ? record.name : "",
    category: typeof record.category === "string" ? record.category : "",
    unit: typeof record.unit === "string" ? record.unit : "",
    description:
      typeof record.description === "string" ? record.description : null,
    // Scanned manufacturer code from inline receive (F011/F020).
    externalBarcode:
      typeof record.externalBarcode === "string"
        ? record.externalBarcode
        : typeof record.barcode === "string"
          ? record.barcode
          : null,
  });

  if (!result.ok) {
    const status =
      result.error === "validation"
        ? 400
        : result.error === "sku_taken" ||
            result.error === "barcode_taken" ||
            result.error === "external_barcode_taken" ||
            result.error === "source_ref_taken"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ item: result.item }, { status: 201 });
}
