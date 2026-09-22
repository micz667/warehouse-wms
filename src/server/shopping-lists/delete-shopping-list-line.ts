import type { PrismaClient } from "@prisma/client";

export type DeleteShoppingListLineResult =
  | { ok: true }
  | {
      ok: false;
      error: "not_found" | "invalid_status";
      message: string;
    };

/**
 * Remove a line from a draft list only.
 */
export async function deleteShoppingListLine(
  db: PrismaClient,
  listId: string,
  lineId: string,
): Promise<DeleteShoppingListLineResult> {
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
  if (list.status !== "draft") {
    return {
      ok: false,
      error: "invalid_status",
      message: "Tylko szkic listy można edytować",
    };
  }

  const line = await db.shoppingListLine.findFirst({
    where: { id: lineId, listId },
  });
  if (!line) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono pozycji listy",
    };
  }

  await db.shoppingListLine.delete({ where: { id: lineId } });
  return { ok: true };
}
