import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export async function listStocktakeSessions(db: PrismaClient) {
  return db.stocktakeSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lines: true } },
    },
  });
}

export async function getStocktakeSession(db: PrismaClient, id: string) {
  const session = await db.stocktakeSession.findUnique({
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

  if (!session) return null;

  if (session.kind !== "inventory") {
    return {
      ...session,
      lines: session.lines.map((line) => ({
        ...line,
        systemQty: null as string | null,
        variance: null as string | null,
      })),
    };
  }

  const lines = [];
  for (const line of session.lines) {
    const systemQty = await sumMovementQty(db, {
      catalogItemId: line.catalogItemId,
      locationId: line.locationId,
    });
    const counted = new Decimal(line.countedQty.toString());
    const variance = counted.minus(systemQty);
    lines.push({
      ...line,
      systemQty: systemQty.toString(),
      variance: variance.toString(),
    });
  }

  return { ...session, lines };
}
