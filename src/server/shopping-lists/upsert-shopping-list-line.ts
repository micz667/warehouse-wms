import type { Prisma, PrismaClient, ShoppingListLine } from "@prisma/client";
import { parsePositiveQty } from "@/server/movements/parse-positive-qty";

export type UpsertShoppingListLineInput = {
  listId: string;
  catalogItemId: string;
  qty: number | string;
  note?: string | null;
};

export type UpsertShoppingListLineResult =
  | { ok: true; line: ShoppingListLine }
  | {
      ok: false;
      error: "validation" | "not_found" | "invalid_status" | "item_not_found";
      message: string;
    };

/**
 * Add or update a line on a draft list. Submitted/done lists are locked for edits.
 */
export async function upsertShoppingListLine(
  db: PrismaClient,
  input: UpsertShoppingListLineInput,
): Promise<UpsertShoppingListLineResult> {
  const parsed = parsePositiveQty(input.qty);
  if (!parsed.ok) {
    return { ok: false, error: "validation", message: parsed.message };
  }
  const catalogItemId = input.catalogItemId?.trim();
  if (!catalogItemId) {
    return {
      ok: false,
      error: "validation",
      message: "Wybierz pozycję katalogu",
    };
  }

  const list = await db.shoppingList.findUnique({
    where: { id: input.listId },
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

  const item = await db.catalogItem.findUnique({
    where: { id: catalogItemId },
  });
  if (!item) {
    return {
      ok: false,
      error: "item_not_found",
      message: "Nie znaleziono pozycji katalogu",
    };
  }

  const note =
    typeof input.note === "string" && input.note.trim().length > 0
      ? input.note.trim()
      : null;

  const data: Prisma.ShoppingListLineUncheckedCreateInput = {
    listId: input.listId,
    catalogItemId,
    qty: parsed.qty,
    note,
  };

  const line = await db.shoppingListLine.upsert({
    where: {
      listId_catalogItemId: {
        listId: input.listId,
        catalogItemId,
      },
    },
    create: data,
    update: { qty: parsed.qty, note },
  });

  return { ok: true, line };
}
