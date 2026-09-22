import type { PrismaClient, ShoppingList, ShoppingListLine } from "@prisma/client";

export type SetShoppingListLineCheckedInput = {
  listId: string;
  lineId: string;
  checked: boolean;
  checkedById?: string | null;
};

export type SetShoppingListLineCheckedResult =
  | { ok: true; line: ShoppingListLine; list: ShoppingList }
  | {
      ok: false;
      error: "not_found" | "invalid_status";
      message: string;
    };

/**
 * Magazynier checklist: mark a line checked/unchecked on a submitted list.
 * When every line is checked, the list advances to done automatically.
 */
export async function setShoppingListLineChecked(
  db: PrismaClient,
  input: SetShoppingListLineCheckedInput,
): Promise<SetShoppingListLineCheckedResult> {
  return db.$transaction(async (tx) => {
    const list = await tx.shoppingList.findUnique({
      where: { id: input.listId },
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
        message: "Odznaczanie pozycji działa tylko na przesłanej liście",
      };
    }

    const existing = await tx.shoppingListLine.findFirst({
      where: { id: input.lineId, listId: input.listId },
    });
    if (!existing) {
      return {
        ok: false,
        error: "not_found",
        message: "Nie znaleziono pozycji listy",
      };
    }

    const line = await tx.shoppingListLine.update({
      where: { id: input.lineId },
      data: input.checked
        ? {
            checkedAt: new Date(),
            checkedById: input.checkedById ?? null,
          }
        : {
            checkedAt: null,
            checkedById: null,
          },
    });

    const remaining = await tx.shoppingListLine.count({
      where: { listId: input.listId, checkedAt: null },
    });

    let nextList = list;
    if (input.checked && remaining === 0) {
      nextList = await tx.shoppingList.update({
        where: { id: input.listId },
        data: { status: "done", doneAt: new Date() },
      });
    }

    return { ok: true, line, list: nextList };
  });
}
