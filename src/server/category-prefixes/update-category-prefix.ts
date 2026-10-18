import type { CategoryPrefix, PrismaClient } from "@prisma/client";
import { PREFIX_PATTERN } from "./constants";
import { normalizePrefixLetters } from "./normalize-prefix";

export type UpdateCategoryPrefixResult =
  | { ok: true; row: CategoryPrefix }
  | {
      ok: false;
      error: "not_found" | "validation" | "prefix_taken" | "prefix_in_use";
      message: string;
    };

/**
 * Edit prefix letters only when no catalog item already uses that prefix code.
 * Category path and nextNumber are not rewritten here.
 */
export async function updateCategoryPrefix(
  db: PrismaClient,
  id: string,
  rawPrefix: string,
): Promise<UpdateCategoryPrefixResult> {
  const existing = await db.categoryPrefix.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "not_found", message: "Prefiks nie istnieje" };
  }

  const prefix = normalizePrefixLetters(rawPrefix);
  if (!PREFIX_PATTERN.test(prefix)) {
    return {
      ok: false,
      error: "validation",
      message: "Prefiks musi mieć 2–4 wielkie litery ASCII (A–Z)",
    };
  }

  if (prefix === existing.prefix) {
    return { ok: true, row: existing };
  }

  const inUse = await db.catalogItem.count({
    where: { barcode: { startsWith: `${existing.prefix}-` } },
  });
  if (inUse > 0) {
    return {
      ok: false,
      error: "prefix_in_use",
      message:
        "Nie można zmienić prefiksu — istnieją już pozycje z tym kodem (etykiety wydrukowane)",
    };
  }

  const taken = await db.categoryPrefix.findUnique({ where: { prefix } });
  if (taken && taken.id !== existing.id) {
    return {
      ok: false,
      error: "prefix_taken",
      message: "Ten prefiks jest już zajęty przez inną kategorię",
    };
  }

  const row = await db.categoryPrefix.update({
    where: { id },
    data: { prefix },
  });
  return { ok: true, row };
}
