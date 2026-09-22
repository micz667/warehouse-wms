import type { PrismaClient, ShoppingList } from "@prisma/client";

export type CreateShoppingListInput = {
  title?: string | null;
  note?: string | null;
  createdById?: string | null;
};

export type CreateShoppingListResult =
  | { ok: true; list: ShoppingList }
  | { ok: false; error: "validation"; message: string };

/**
 * Opens a draft shopping list. Lines and submit follow.
 */
export async function createShoppingList(
  db: PrismaClient,
  input: CreateShoppingListInput = {},
): Promise<CreateShoppingListResult> {
  const title =
    typeof input.title === "string" && input.title.trim().length > 0
      ? input.title.trim()
      : null;
  const note =
    typeof input.note === "string" && input.note.trim().length > 0
      ? input.note.trim()
      : null;

  const list = await db.shoppingList.create({
    data: {
      status: "draft",
      title,
      note,
      createdById: input.createdById ?? null,
    },
  });

  return { ok: true, list };
}
