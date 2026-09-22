import type { PrismaClient, ShoppingList, ShoppingListStatus } from "@prisma/client";

export type ListShoppingListsOptions = {
  /** When set, only these statuses. */
  statuses?: ShoppingListStatus[];
};

export async function listShoppingLists(
  db: PrismaClient,
  options: ListShoppingListsOptions = {},
) {
  return db.shoppingList.findMany({
    where:
      options.statuses && options.statuses.length > 0
        ? { status: { in: options.statuses } }
        : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lines: true } },
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });
}

export async function getShoppingList(db: PrismaClient, id: string) {
  return db.shoppingList.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, email: true, name: true } },
      lines: {
        orderBy: { createdAt: "asc" },
        include: {
          catalogItem: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true,
              barcode: true,
            },
          },
          checkedBy: {
            select: { id: true, email: true, name: true },
          },
        },
      },
    },
  });
}

export type ShoppingListWithMeta = Awaited<
  ReturnType<typeof getShoppingList>
> extends infer T
  ? T
  : never;

/** Re-export for callers that only need the list row type. */
export type { ShoppingList };
