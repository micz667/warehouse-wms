import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { upsertShoppingListLine } from "@/server/shopping-lists/upsert-shopping-list-line";
import { SHOPPING_LIST_CREATE_ROLES } from "@/server/shopping-lists/roles";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, SHOPPING_LIST_CREATE_ROLES);
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
  const result = await upsertShoppingListLine(prisma, {
    listId: id,
    catalogItemId:
      typeof record.catalogItemId === "string" ? record.catalogItemId : "",
    qty:
      typeof record.qty === "number" || typeof record.qty === "string"
        ? record.qty
        : "",
    note: typeof record.note === "string" ? record.note : null,
  });

  if (!result.ok) {
    const status =
      result.error === "validation"
        ? 400
        : result.error === "not_found" || result.error === "item_not_found"
          ? 404
          : result.error === "invalid_status"
            ? 409
            : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ line: result.line }, { status: 201 });
}
