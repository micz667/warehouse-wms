import type { CatalogItem, PrismaClient } from "@prisma/client";

export type UpdateCatalogItemInput = {
  sku?: string;
  name?: string;
  category?: string;
  unit?: string;
  photoPath?: string | null;
};

export type UpdateCatalogItemResult =
  | { ok: true; item: CatalogItem }
  | {
      ok: false;
      error: "not_found" | "validation" | "sku_taken";
      message: string;
    };

function trimOptional(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Updates editable catalog fields. Barcode stays immutable after create (label already printed). */
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
    sku?: string;
    name?: string;
    category?: string;
    unit?: string;
    photoPath?: string | null;
  } = {};

  if (input.sku !== undefined) {
    const sku = trimOptional(input.sku);
    if (!sku) {
      return {
        ok: false,
        error: "validation",
        message: "SKU nie może być puste",
      };
    }
    if (sku !== existing.sku) {
      const taken = await db.catalogItem.findUnique({ where: { sku } });
      if (taken) {
        return {
          ok: false,
          error: "sku_taken",
          message: "SKU już istnieje",
        };
      }
      data.sku = sku;
    }
  }

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

  const item = await db.catalogItem.update({
    where: { id },
    data,
  });
  return { ok: true, item };
}
