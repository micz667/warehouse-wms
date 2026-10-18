import type { CatalogItem, PrismaClient } from "@prisma/client";
import { allocateItemCode } from "@/server/category-prefixes/allocate-item-code";

export type CreateCatalogItemInput = {
  name: string;
  category: string;
  unit: string;
  description?: string | null;
  photoPath?: string | null;
  /**
   * Scanned manufacturer / factory barcode (EAN etc.). Stored as
   * `externalBarcode` so scan hub still resolves it. Warehouse SKU/barcode
   * is always the allocated category code (F020).
   */
  externalBarcode?: string | null;
  /**
   * @deprecated Prefer `externalBarcode`. Accepted for F011 inline create
   * payloads that still send `barcode` — treated as external when set.
   */
  barcode?: string;
  /** Import identity e.g. `poc:<id>` — unique when set. */
  sourceRef?: string | null;
  /**
   * Optional pre-assigned code (import deterministic path). When set, skips
   * the allocator and uses this value for both sku and barcode.
   */
  assignedCode?: string;
};

export type CreateCatalogItemResult =
  | { ok: true; item: CatalogItem }
  | {
      ok: false;
      error:
        | "validation"
        | "sku_taken"
        | "barcode_taken"
        | "external_barcode_taken"
        | "source_ref_taken";
      message: string;
    };

function trimRequired(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Durable catalog create — always assigns a category-prefix code as both
 * SKU and Code128 barcode (F020). Optional external/manufacturer barcode
 * is stored separately for scan lookup.
 */
export async function createCatalogItem(
  db: PrismaClient,
  input: CreateCatalogItemInput,
): Promise<CreateCatalogItemResult> {
  const name = trimRequired(input.name);
  const category = trimRequired(input.category);
  const unit = trimRequired(input.unit);
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const descriptionValue = description.length > 0 ? description : null;

  if (!name || !category || !unit) {
    return {
      ok: false,
      error: "validation",
      message: "Nazwa, kategoria i jednostka są wymagane",
    };
  }

  const externalRaw =
    trimRequired(input.externalBarcode ?? undefined) ??
    trimRequired(input.barcode ?? undefined);

  let code: string;
  if (input.assignedCode?.trim()) {
    code = input.assignedCode.trim();
  } else {
    try {
      code = await allocateItemCode(db, category);
    } catch (err) {
      return {
        ok: false,
        error: "validation",
        message:
          err instanceof Error
            ? err.message
            : "Nie udało się przydzielić kodu pozycji",
      };
    }
  }

  // If the caller passed our own code as "barcode", do not also store it
  // as external (would unique-collide with barcode).
  const externalBarcode =
    externalRaw && externalRaw !== code ? externalRaw : null;

  if (externalBarcode) {
    const takenExt = await db.catalogItem.findFirst({
      where: {
        OR: [{ barcode: externalBarcode }, { externalBarcode }],
      },
    });
    if (takenExt) {
      return {
        ok: false,
        error: "external_barcode_taken",
        message: "Kod zewnętrzny / producenta już istnieje",
      };
    }
  }

  const sourceRef =
    typeof input.sourceRef === "string" && input.sourceRef.trim()
      ? input.sourceRef.trim()
      : null;

  if (sourceRef) {
    const takenRef = await db.catalogItem.findUnique({
      where: { sourceRef },
    });
    if (takenRef) {
      return {
        ok: false,
        error: "source_ref_taken",
        message: "Identyfikator źródła już istnieje",
      };
    }
  }

  const existingSku = await db.catalogItem.findUnique({ where: { sku: code } });
  if (existingSku) {
    return {
      ok: false,
      error: "sku_taken",
      message: "Kod pozycji już istnieje",
    };
  }

  try {
    const item = await db.catalogItem.create({
      data: {
        sku: code,
        name,
        category,
        unit,
        barcode: code,
        externalBarcode,
        sourceRef,
        description: descriptionValue,
        photoPath: input.photoPath ?? null,
      },
    });
    return { ok: true, item };
  } catch {
    return {
      ok: false,
      error: "barcode_taken",
      message: "Kod pozycji już istnieje",
    };
  }
}
