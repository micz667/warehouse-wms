import type { Location, PrismaClient } from "@prisma/client";

/** Flat location list — matches code or label (case-insensitive). */
export async function listLocations(
  db: PrismaClient,
  query?: string,
): Promise<Location[]> {
  const q = query?.trim();
  if (!q) {
    return db.location.findMany({
      orderBy: [{ code: "asc" }, { label: "asc" }],
    });
  }

  return db.location.findMany({
    where: {
      OR: [
        { code: { contains: q, mode: "insensitive" } },
        { label: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ code: "asc" }, { label: "asc" }],
  });
}
