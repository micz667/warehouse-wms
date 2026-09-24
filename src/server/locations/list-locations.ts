import type { Location, PrismaClient, Prisma } from "@prisma/client";

export type ListLocationsOptions = {
  query?: string;
  /** When true, only renovation-section locations (F016). */
  renovationOnly?: boolean;
};

/** Flat location list — matches code or label (case-insensitive). */
export async function listLocations(
  db: PrismaClient,
  queryOrOptions?: string | ListLocationsOptions,
): Promise<Location[]> {
  const options: ListLocationsOptions =
    typeof queryOrOptions === "string" || queryOrOptions === undefined
      ? { query: queryOrOptions }
      : queryOrOptions;

  const q = options.query?.trim();
  const where: Prisma.LocationWhereInput = {};
  if (options.renovationOnly) {
    where.isRenovation = true;
  }
  if (q) {
    where.OR = [
      { code: { contains: q, mode: "insensitive" } },
      { label: { contains: q, mode: "insensitive" } },
    ];
  }

  return db.location.findMany({
    where,
    orderBy: [{ code: "asc" }, { label: "asc" }],
  });
}
