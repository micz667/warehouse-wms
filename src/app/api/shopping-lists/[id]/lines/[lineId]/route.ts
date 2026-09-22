import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { deleteShoppingListLine } from "@/server/shopping-lists/delete-shopping-list-line";
import { SHOPPING_LIST_CREATE_ROLES } from "@/server/shopping-lists/roles";

type Params = { params: Promise<{ id: string; lineId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
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

  const { id, lineId } = await params;
  const result = await deleteShoppingListLine(prisma, id, lineId);
  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "invalid_status"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ ok: true });
}
