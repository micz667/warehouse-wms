import type { CafeIssue, PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { parsePositiveQty } from "@/server/movements/parse-positive-qty";

export type PrepareCafeIssueLineInput = {
  catalogItemId: string;
  sourceLocationId: string;
  qty: unknown;
};

export type PrepareCafeIssueInput = {
  cafeLocationId: string;
  note?: string | null;
  createdById?: string | null;
  lines: PrepareCafeIssueLineInput[];
};

export type PrepareCafeIssueResult =
  | { ok: true; cafeIssue: CafeIssue }
  | {
      ok: false;
      error: "validation" | "not_found" | "empty";
      message: string;
    };

/**
 * Persist a prepared / in-transit cafe shipment.
 * Does NOT create Movement rows — warehouse stock is unchanged (F013a).
 */
export async function prepareCafeIssue(
  db: PrismaClient,
  input: PrepareCafeIssueInput,
): Promise<PrepareCafeIssueResult> {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    return {
      ok: false,
      error: "empty",
      message: "Dodaj co najmniej jedną pozycję do paczki",
    };
  }

  if (
    typeof input.cafeLocationId !== "string" ||
    !input.cafeLocationId.trim()
  ) {
    return {
      ok: false,
      error: "validation",
      message: "Wybierz kawiarnię docelową",
    };
  }

  const parsedLines: {
    catalogItemId: string;
    sourceLocationId: string;
    qty: Decimal;
  }[] = [];

  const seen = new Set<string>();
  for (const raw of input.lines) {
    if (
      typeof raw.catalogItemId !== "string" ||
      !raw.catalogItemId.trim() ||
      typeof raw.sourceLocationId !== "string" ||
      !raw.sourceLocationId.trim()
    ) {
      return {
        ok: false,
        error: "validation",
        message: "Każda pozycja wymaga towaru i lokalizacji źródłowej",
      };
    }
    const parsed = parsePositiveQty(raw.qty);
    if (!parsed.ok) {
      return { ok: false, error: "validation", message: parsed.message };
    }
    const key = `${raw.catalogItemId}\0${raw.sourceLocationId}`;
    if (seen.has(key)) {
      return {
        ok: false,
        error: "validation",
        message:
          "Ta sama pozycja z tej samej półki może wystąpić tylko raz — połącz ilości",
      };
    }
    seen.add(key);
    parsedLines.push({
      catalogItemId: raw.catalogItemId.trim(),
      sourceLocationId: raw.sourceLocationId.trim(),
      qty: parsed.qty,
    });
  }

  const note =
    typeof input.note === "string" && input.note.trim().length > 0
      ? input.note.trim()
      : null;

  return db.$transaction(async (tx) => {
    const cafe = await tx.location.findUnique({
      where: { id: input.cafeLocationId },
    });
    if (!cafe) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono kawiarni (lokalizacji docelowej)",
      };
    }

    for (const line of parsedLines) {
      const [item, source] = await Promise.all([
        tx.catalogItem.findUnique({ where: { id: line.catalogItemId } }),
        tx.location.findUnique({ where: { id: line.sourceLocationId } }),
      ]);
      if (!item) {
        return {
          ok: false as const,
          error: "not_found" as const,
          message: "Nie znaleziono pozycji katalogu",
        };
      }
      if (!source) {
        return {
          ok: false as const,
          error: "not_found" as const,
          message: "Nie znaleziono lokalizacji źródłowej",
        };
      }
      if (source.id === cafe.id) {
        return {
          ok: false as const,
          error: "validation" as const,
          message: "Źródło nie może być tą samą lokalizacją co kawiarnia",
        };
      }
    }

    const cafeIssue = await tx.cafeIssue.create({
      data: {
        status: "prepared",
        cafeLocationId: cafe.id,
        note,
        createdById: input.createdById ?? null,
        preparedAt: new Date(),
        lines: {
          create: parsedLines.map((line) => ({
            catalogItemId: line.catalogItemId,
            sourceLocationId: line.sourceLocationId,
            qty: line.qty,
          })),
        },
      },
    });

    return { ok: true as const, cafeIssue };
  });
}
