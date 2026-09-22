import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { getShoppingList } from "@/server/shopping-lists/list-shopping-lists";
import { SHOPPING_LIST_READ_ROLES } from "@/server/shopping-lists/roles";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, SHOPPING_LIST_READ_ROLES);
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
  const list = await getShoppingList(prisma, id);
  if (!list) {
    return Response.json(
      { error: "Nie znaleziono listy zakupów" },
      { status: 404 },
    );
  }

  // Magazynier does not browse drafts or history; allow submitted (and done if opened).
  if (gate.role === "magazynier" && list.status === "draft") {
    return Response.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  return Response.json({ list });
}
