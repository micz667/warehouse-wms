import type { CatalogItem, PrismaClient } from "@prisma/client";

export type UpdateCatalogItemInput = {
  /** Ignored when present — item codes are immutable after assign (F020). */
  sku?: string;
  name?: string;
  category?: string;
  unit?: string;
  photoPath?: string | null;
  externalBarcode?: string | null;
};

export type UpdateCatalogItemResult =
  | { ok: true; item: CatalogItem }
  | {
      ok: false;
      error: "not_found" | "validation" | "sku_taken" | "external_barcode_taken";
      message: string;
    };

function trimOptional(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Updates editable catalog fields.
 * SKU and warehouse barcode stay immutable (labels already printed).
 * Category may change for filing — it does NOT renumber the code (F020).
 */
export async function updateCatalogItem(
  db: PrismaClient,
  id: string,
  input: UpdateCatalogItemInput,
): Promise<UpdateCatalogItemResult> {
  const existing = await db.catalogItem.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "not_found", message: "Pozycja nie istnieje" };
  }

  const data: {
    name?: string;
    category?: string;
    unit?: string;
    photoPath?: string | null;
    externalBarcode?: string | null;
  } = {};

  if (input.name !== undefined) {
    const name = trimOptional(input.name);
    if (!name) {
      return {
        ok: false,
        error: "validation",
        message: "Nazwa nie może być pusta",
      };
    }
    data.name = name;
  }

  if (input.category !== undefined) {
    const category = trimOptional(input.category);
    if (!category) {
      return {
        ok: false,
        error: "validation",
        message: "Kategoria nie może być pusta",
      };
    }
    data.category = category;
  }

  if (input.unit !== undefined) {
    const unit = trimOptional(input.unit);
    if (!unit) {
      return {
        ok: false,
        error: "validation",
        message: "Jednostka nie może być pusta",
      };
    }
    data.unit = unit;
  }

  if (input.photoPath !== undefined) {
    data.photoPath = input.photoPath;
  }

  if (input.externalBarcode !== undefined) {
    const external = trimOptional(input.externalBarcode);
    if (external === null) {
      data.externalBarcode = null;
    } else if (external !== undefined) {
      if (external === existing.barcode || external === existing.sku) {
        return {
          ok: false,
          error: "validation",
          message: "Kod zewnętrzny nie może być równy kodowi magazynowemu",
        };
      }
      const taken = await db.catalogItem.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [{ barcode: external }, { externalBarcode: external }],
            },
          ],
        },
      });
      if (taken) {
        return {
          ok: false,
          error: "external_barcode_taken",
          message: "Kod zewnętrzny / producenta już istnieje",
        };
      }
      data.externalBarcode = external;
    }
  }

  const item = await db.catalogItem.update({
    where: { id },
    data,
  });
  return { ok: true, item };
}
