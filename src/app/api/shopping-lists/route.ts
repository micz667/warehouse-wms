import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { createShoppingList } from "@/server/shopping-lists/create-shopping-list";
import { listShoppingLists } from "@/server/shopping-lists/list-shopping-lists";
import {
  SHOPPING_LIST_CREATE_ROLES,
  SHOPPING_LIST_HISTORY_ROLES,
  SHOPPING_LIST_READ_ROLES,
} from "@/server/shopping-lists/roles";
import type { ShoppingListStatus } from "@prisma/client";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const role = gate.role;

  let statuses: ShoppingListStatus[] | undefined;
  if (scope === "history") {
    const historyGate = gateRole(role, SHOPPING_LIST_HISTORY_ROLES);
    if (!historyGate.ok) {
      return Response.json({ error: "Brak uprawnień" }, { status: 403 });
    }
    statuses = ["done"];
  } else if (scope === "fulfill") {
    statuses = ["submitted"];
  } else if (scope === "drafts") {
    statuses = ["draft"];
  } else if (role === "magazynier") {
    // Hall default: open submitted lists only (no draft/history noise).
    statuses = ["submitted"];
  }

  const lists = await listShoppingLists(prisma, { statuses });
  return Response.json({ lists });
}

export async function POST(request: Request) {
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

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const result = await createShoppingList(prisma, {
    title: typeof record.title === "string" ? record.title : null,
    note: typeof record.note === "string" ? record.note : null,
    createdById: session?.user?.id ?? null,
  });

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  return Response.json({ list: result.list }, { status: 201 });
}
