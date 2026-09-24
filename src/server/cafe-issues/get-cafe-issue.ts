import type { PrismaClient } from "@prisma/client";

/**
 * Load one cafe issue with lines (+ signer) for reopen / signature / receipt.
 */
export async function getCafeIssue(db: PrismaClient, id: string) {
  if (!id.trim()) return null;

  return db.cafeIssue.findUnique({
    where: { id },
    include: {
      cafeLocation: {
        select: { id: true, code: true, label: true },
      },
      signedBy: {
        select: { id: true, name: true, email: true },
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
