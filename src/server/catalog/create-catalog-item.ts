import type { CatalogItem, PrismaClient } from "@prisma/client";
import { generateBarcodeValue } from "./generate-barcode";

export type CreateCatalogItemInput = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  photoPath?: string | null;
  /** Override only for tests or import; production create auto-generates. */
  barcode?: string;
};

export type CreateCatalogItemResult =
  | { ok: true; item: CatalogItem }
  | { ok: false; error: "validation" | "sku_taken" | "barcode_taken"; message: string };

const MAX_BARCODE_ATTEMPTS = 8;

function trimRequired(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Durable catalog create — F005 stocktake can call this without the CRUD UI.
 * Always assigns a unique Code128 barcode when `barcode` is omitted.
 */
export async function createCatalogItem(
  db: PrismaClient,
  input: CreateCatalogItemInput,
): Promise<CreateCatalogItemResult> {
  const sku = trimRequired(input.sku);
  const name = trimRequired(input.name);
  const category = trimRequired(input.category);
  const unit = trimRequired(input.unit);

  if (!sku || !name || !category || !unit) {
    return {
      ok: false,
      error: "validation",
      message: "SKU, nazwa, kategoria i jednostka są wymagane",
    };
  }

  const existingSku = await db.catalogItem.findUnique({ where: { sku } });
  if (existingSku) {
    return {
      ok: false,
      error: "sku_taken",
      message: "SKU już istnieje",
    };
  }

  if (input.barcode) {
    const barcode = input.barcode.trim();
    if (!barcode) {
      return {
        ok: false,
        error: "validation",
        message: "Kod kreskowy nie może być pusty",
      };
    }
    try {
      const item = await db.catalogItem.create({
        data: {
          sku,
          name,
          category,
          unit,
          barcode,
          photoPath: input.photoPath ?? null,
        },
      });
      return { ok: true, item };
    } catch {
      return {
        ok: false,
        error: "barcode_taken",
        message: "Kod kreskowy już istnieje",
      };
    }
  }

  for (let attempt = 0; attempt < MAX_BARCODE_ATTEMPTS; attempt++) {
    const barcode = generateBarcodeValue();
    try {
      const item = await db.catalogItem.create({
        data: {
          sku,
          name,
          category,
          unit,
          barcode,
          photoPath: input.photoPath ?? null,
        },
      });
      return { ok: true, item };
    } catch {
      // Unique barcode collision — retry with a new value.
    }
  }

  return {
    ok: false,
    error: "barcode_taken",
    message: "Nie udało się wygenerować unikalnego kodu kreskowego",
  };
}
