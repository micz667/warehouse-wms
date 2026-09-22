import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { setShoppingListLineChecked } from "@/server/shopping-lists/set-shopping-list-line-checked";
import { SHOPPING_LIST_FULFILL_ROLES } from "@/server/shopping-lists/roles";

type Params = { params: Promise<{ id: string; lineId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, SHOPPING_LIST_FULFILL_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  const { id, lineId } = await params;

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
  if (typeof record.checked !== "boolean") {
    return Response.json(
      { error: "Pole checked (boolean) jest wymagane" },
      { status: 400 },
    );
  }

  const result = await setShoppingListLineChecked(prisma, {
    listId: id,
    lineId,
    checked: record.checked,
    checkedById: session?.user?.id ?? null,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "invalid_status"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ line: result.line, list: result.list });
}
