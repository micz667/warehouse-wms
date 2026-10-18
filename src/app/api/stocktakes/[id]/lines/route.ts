import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { upsertStocktakeLine } from "@/server/stocktake/upsert-stocktake-line";
import { STOCKTAKE_WRITE_ROLES } from "@/server/stocktake/roles";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
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

  const { id } = await params;

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
  const newItemRaw =
    record.newItem && typeof record.newItem === "object"
      ? (record.newItem as Record<string, unknown>)
      : null;

  const result = await upsertStocktakeLine(prisma, {
    sessionId: id,
    catalogItemId:
      typeof record.catalogItemId === "string" ? record.catalogItemId : undefined,
    locationId:
      typeof record.locationId === "string" ? record.locationId : "",
    countedQty:
      typeof record.countedQty === "number" || typeof record.countedQty === "string"
        ? record.countedQty
        : "",
    newItem: newItemRaw
      ? {
          name: typeof newItemRaw.name === "string" ? newItemRaw.name : "",
          category:
            typeof newItemRaw.category === "string" ? newItemRaw.category : "",
          unit: typeof newItemRaw.unit === "string" ? newItemRaw.unit : "",
        }
      : undefined,
  });

  if (!result.ok) {
    const status =
      result.error === "validation"
        ? 400
        : result.error === "not_found" ||
            result.error === "item_not_found" ||
            result.error === "location_not_found"
          ? 404
          : result.error === "invalid_status"
            ? 409
            : result.error === "sku_taken" || result.error === "barcode_taken"
              ? 409
              : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ line: result.line }, { status: 201 });
}
