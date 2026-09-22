import type { PrismaClient } from "@prisma/client";

export async function listStocktakeSessions(db: PrismaClient) {
  return db.stocktakeSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lines: true } },
    },
  });
}

export async function getStocktakeSession(db: PrismaClient, id: string) {
  return db.stocktakeSession.findUnique({
    where: { id },
    include: {
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
          location: {
            select: { id: true, code: true, label: true },
          },
        },
      },
    },
  });
}
