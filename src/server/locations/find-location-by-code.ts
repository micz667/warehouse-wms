import type { Location, PrismaClient } from "@prisma/client";
import { normalizeLocationCode } from "./normalize-location-code";

/** Resolve a typed or scanned code to a location (F007 movement seam). */
export async function findLocationByCode(
  db: PrismaClient,
  rawCode: string,
): Promise<Location | null> {
  const code = normalizeLocationCode(rawCode);
  if (!code) return null;
  return db.location.findUnique({ where: { code } });
}
