import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { completeShoppingList } from "@/server/shopping-lists/complete-shopping-list";
import { SHOPPING_LIST_FULFILL_ROLES } from "@/server/shopping-lists/roles";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
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

  const { id } = await params;
  const result = await completeShoppingList(prisma, id);
  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "invalid_status"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ list: result.list });
}
