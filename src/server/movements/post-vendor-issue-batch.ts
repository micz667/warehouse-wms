import type { Movement, PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { parsePositiveQty } from "./parse-positive-qty";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export type VendorIssueLineInput = {
  catalogItemId: string;
  locationId: string;
  qty: unknown;
};

export type PostVendorIssueBatchInput = {
  lines: VendorIssueLineInput[];
  createdById?: string | null;
  note?: string | null;
};

export type PostVendorIssueBatchResult =
  | { ok: true; movements: Movement[] }
  | {
      ok: false;
      error:
        | "validation"
        | "not_found"
        | "not_renovation"
        | "insufficient_stock"
        | "empty";
      message: string;
    };

/**
 * Batch vendor issue from renovation (F016): −qty issue rows from
 * renovation-section locations only. Actor + time on each Movement.
 */
export async function postVendorIssueBatch(
  db: PrismaClient,
  input: PostVendorIssueBatchInput,
): Promise<PostVendorIssueBatchResult> {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Dodaj co najmniej jedną pozycję do wydania",
    };
  }

  const parsedLines: {
    catalogItemId: string;
    locationId: string;
    qty: Decimal;
  }[] = [];
  const seen = new Set<string>();

  for (const raw of input.lines) {
    if (
      typeof raw.catalogItemId !== "string" ||
      !raw.catalogItemId.trim() ||
      typeof raw.locationId !== "string" ||
      !raw.locationId.trim()
    ) {
      return {
        ok: false,
        error: "validation",
        message: "Każda pozycja wymaga towaru i lokalizacji renowacji",
      };
    }
    const parsed = parsePositiveQty(raw.qty);
    if (!parsed.ok) {
      return { ok: false, error: "validation", message: parsed.message };
    }
    const key = `${raw.catalogItemId}\0${raw.locationId}`;
    if (seen.has(key)) {
      return {
        ok: false,
        error: "validation",
        message:
          "Ta sama pozycja z tej lokalizacji jest już na liście — połącz ilości",
      };
    }
    seen.add(key);
    parsedLines.push({
      catalogItemId: raw.catalogItemId,
      locationId: raw.locationId,
      qty: parsed.qty,
    });
  }

  return db.$transaction(async (tx) => {
    const movements: Movement[] = [];

    for (const line of parsedLines) {
      const [item, location] = await Promise.all([
        tx.catalogItem.findUnique({ where: { id: line.catalogItemId } }),
        tx.location.findUnique({ where: { id: line.locationId } }),
      ]);
      if (!item) {
        return {
          ok: false as const,
          error: "not_found" as const,
          message: "Nie znaleziono pozycji katalogu",
        };
      }
      if (!location) {
        return {
          ok: false as const,
          error: "not_found" as const,
          message: "Nie znaleziono lokalizacji",
        };
      }
      if (!location.isRenovation) {
        return {
          ok: false as const,
          error: "not_renovation" as const,
          message: `Lokalizacja ${location.code} nie jest sekcją renowacji`,
        };
      }

      const balance = await sumMovementQty(tx, {
        catalogItemId: item.id,
        locationId: location.id,
      });
      if (balance.lt(line.qty)) {
        return {
          ok: false as const,
          error: "insufficient_stock" as const,
          message: `Brak stanu w renowacji (${location.code}): dostępne ${balance.toString()}, żądane ${line.qty.toString()}`,
        };
      }

      const movement = await tx.movement.create({
        data: {
          type: "issue",
          catalogItemId: item.id,
          locationId: location.id,
          qty: line.qty.neg(),
          createdById: input.createdById ?? null,
        },
      });
      movements.push(movement);
    }

    return { ok: true as const, movements };
  });
}
