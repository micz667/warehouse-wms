import type { PrismaClient, ShoppingList } from "@prisma/client";

export type SubmitShoppingListResult =
  | { ok: true; list: ShoppingList }
  | {
      ok: false;
      error: "not_found" | "invalid_status" | "empty";
      message: string;
    };

/**
 * Submits a draft list for warehouse fulfillment.
 */
export async function submitShoppingList(
  db: PrismaClient,
  listId: string,
): Promise<SubmitShoppingListResult> {
  const list = await db.shoppingList.findUnique({
    where: { id: listId },
    include: { _count: { select: { lines: true } } },
  });
  if (!list) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono listy zakupów",
    };
  }
  if (list.status !== "draft") {
    return {
      ok: false,
      error: "invalid_status",
      message: "Przesłać można tylko szkic listy",
    };
  }
  if (list._count.lines === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Dodaj co najmniej jedną pozycję przed przesłaniem",
    };
  }

  const updated = await db.shoppingList.update({
    where: { id: listId },
    data: {
      status: "submitted",
      submittedAt: new Date(),
    },
  });

  return { ok: true, list: updated };
}
