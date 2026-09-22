import type { PrismaClient, ShoppingList } from "@prisma/client";

export type CompleteShoppingListResult =
  | { ok: true; list: ShoppingList }
  | {
      ok: false;
      error: "not_found" | "invalid_status";
      message: string;
    };

/**
 * Explicitly mark a submitted list as done (all lines need not be checked).
 */
export async function completeShoppingList(
  db: PrismaClient,
  listId: string,
): Promise<CompleteShoppingListResult> {
  const list = await db.shoppingList.findUnique({
    where: { id: listId },
  });
  if (!list) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono listy zakupów",
    };
  }
  if (list.status !== "submitted") {
    return {
      ok: false,
      error: "invalid_status",
      message: "Zamknąć można tylko przesłaną listę",
    };
  }

  const updated = await db.shoppingList.update({
    where: { id: listId },
    data: {
      status: "done",
      doneAt: new Date(),
    },
  });

  return { ok: true, list: updated };
}
