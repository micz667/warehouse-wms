import type { PrismaClient } from "@prisma/client";

/**
 * Load one cafe issue with lines for reopen / F013b signature pickup.
 */
export async function getCafeIssue(db: PrismaClient, id: string) {
  if (!id.trim()) return null;

  return db.cafeIssue.findUnique({
    where: { id },
    include: {
      cafeLocation: {
        select: { id: true, code: true, label: true },
      },
      lines: {
        orderBy: { createdAt: "asc" },
        include: {
          catalogItem: {
            select: {
              id: true,
              sku: true,
              name: true,
              barcode: true,
              unit: true,
            },
          },
          sourceLocation: {
            select: { id: true, code: true, label: true },
          },
        },
      },
    },
  });
}
