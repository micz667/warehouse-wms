import type { Prisma, PrismaClient, StocktakeLine } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { createCatalogItem } from "@/server/catalog/create-catalog-item";

export type UpsertStocktakeLineInput = {
  sessionId: string;
  catalogItemId?: string;
  /** Inline create when catalog item is missing during count. */
  newItem?: {
    name: string;
    category: string;
    unit: string;
  };
  locationId: string;
  countedQty: number | string;
};

export type UpsertStocktakeLineResult =
  | { ok: true; line: StocktakeLine }
  | {
      ok: false;
      error:
        | "validation"
        | "not_found"
        | "invalid_status"
        | "item_not_found"
        | "location_not_found"
        | "sku_taken"
        | "barcode_taken"
        | "external_barcode_taken"
        | "source_ref_taken";
      message: string;
    };

function parseQty(value: number | string): Decimal | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    return new Decimal(value);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const qty = new Decimal(trimmed);
    if (qty.isNeg()) return null;
    return qty;
  } catch {
    return null;
  }
}

/**
 * Add or update a count line on a draft/counting session.
 * Approved sessions are blocked (no edits after opening movements post).
 */
export async function upsertStocktakeLine(
  db: PrismaClient,
  input: UpsertStocktakeLineInput,
): Promise<UpsertStocktakeLineResult> {
  const qty = parseQty(input.countedQty);
  if (!qty) {
    return {
      ok: false,
      error: "validation",
      message: "Ilość musi być liczbą nieujemną",
    };
  }
  if (!input.locationId?.trim()) {
    return {
      ok: false,
      error: "validation",
      message: "Lokalizacja jest wymagana",
    };
  }

  const session = await db.stocktakeSession.findUnique({
    where: { id: input.sessionId },
  });
  if (!session) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono sesji spisu",
    };
  }
  if (session.status === "approved") {
    return {
      ok: false,
      error: "invalid_status",
      message: "Zatwierdzony spis nie może być edytowany",
    };
  }
  if (session.status !== "draft" && session.status !== "counting") {
    return {
      ok: false,
      error: "invalid_status",
      message: "Sesja w nieprawidłowym statusie",
    };
  }

  const location = await db.location.findUnique({
    where: { id: input.locationId },
  });
  if (!location) {
    return {
      ok: false,
      error: "location_not_found",
      message: "Nie znaleziono lokalizacji",
    };
  }

  let catalogItemId = input.catalogItemId?.trim() || null;
  if (!catalogItemId) {
    if (!input.newItem) {
      return {
        ok: false,
        error: "validation",
        message: "Wybierz pozycję katalogu lub utwórz nową",
      };
    }
    const created = await createCatalogItem(db, input.newItem);
    if (!created.ok) {
      return {
        ok: false,
        error: created.error,
        message: created.message,
      };
    }
    catalogItemId = created.item.id;
  } else {
    const item = await db.catalogItem.findUnique({
      where: { id: catalogItemId },
    });
    if (!item) {
      return {
        ok: false,
        error: "item_not_found",
        message: "Nie znaleziono pozycji katalogu",
      };
    }
  }

  const data: Prisma.StocktakeLineUncheckedCreateInput = {
    sessionId: input.sessionId,
    catalogItemId,
    locationId: location.id,
    countedQty: qty,
  };

  const line = await db.stocktakeLine.upsert({
    where: {
      sessionId_catalogItemId_locationId: {
        sessionId: input.sessionId,
        catalogItemId,
        locationId: location.id,
      },
    },
    create: data,
    update: { countedQty: qty },
  });

  return { ok: true, line };
}
