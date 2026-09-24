import type { CafeIssue, Movement, PrismaClient } from "@prisma/client";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export type SignCafeIssueInput = {
  cafeIssueId: string;
  /** PNG data URL from finger-sign canvas (PWA). */
  signatureData: unknown;
  signedById?: string | null;
};

export type SignCafeIssueResult =
  | {
      ok: true;
      cafeIssue: CafeIssue;
      movements: Movement[];
    }
  | {
      ok: false;
      error:
        | "validation"
        | "not_found"
        | "invalid_status"
        | "insufficient_stock"
        | "empty";
      message: string;
    };

const MIN_SIGNATURE_LENGTH = 80;

function parseSignatureData(raw: unknown):
  | { ok: true; data: string }
  | { ok: false; message: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      ok: false,
      message: "Wymagany podpis palcem na ekranie",
    };
  }
  const data = raw.trim();
  if (!data.startsWith("data:image/")) {
    return {
      ok: false,
      message: "Nieprawidłowy format podpisu",
    };
  }
  if (data.length < MIN_SIGNATURE_LENGTH) {
    return {
      ok: false,
      message: "Podpis jest pusty — narysuj podpis na polu",
    };
  }
  return { ok: true, data };
}

/**
 * On-site receipt: persist finger signature and post issue movements in one
 * transaction. Stock leaves the warehouse only after a successful sign (F013b).
 * Same negative-stock rule as hall issue — refuse overdraw.
 */
export async function signCafeIssue(
  db: PrismaClient,
  input: SignCafeIssueInput,
): Promise<SignCafeIssueResult> {
  if (
    typeof input.cafeIssueId !== "string" ||
    !input.cafeIssueId.trim()
  ) {
    return {
      ok: false,
      error: "validation",
      message: "Brak identyfikatora dokumentu wydania",
    };
  }

  const parsedSig = parseSignatureData(input.signatureData);
  if (!parsedSig.ok) {
    return { ok: false, error: "validation", message: parsedSig.message };
  }

  return db.$transaction(async (tx) => {
    const doc = await tx.cafeIssue.findUnique({
      where: { id: input.cafeIssueId.trim() },
      include: { lines: true },
    });

    if (!doc) {
      return {
        ok: false as const,
        error: "not_found" as const,
        message: "Nie znaleziono dokumentu wydania",
      };
    }

    if (doc.status !== "prepared") {
      return {
        ok: false as const,
        error: "invalid_status" as const,
        message:
          doc.status === "received"
            ? "Dokument jest już podpisany — ponowny podpis zablokowany"
            : "Podpisać można tylko przygotowaną paczkę (w drodze)",
      };
    }

    if (doc.lines.length === 0) {
      return {
        ok: false as const,
        error: "empty" as const,
        message: "Nie można podpisać pustej paczki",
      };
    }

    const signedAt = new Date();
    const movements: Movement[] = [];

    for (const line of doc.lines) {
      const balance = await sumMovementQty(tx, {
        catalogItemId: line.catalogItemId,
        locationId: line.sourceLocationId,
      });
      if (balance.lt(line.qty)) {
        return {
          ok: false as const,
          error: "insufficient_stock" as const,
          message: `Brak stanu: dostępne ${balance.toString()}, żądane ${line.qty.toString()}`,
        };
      }

      const movement = await tx.movement.create({
        data: {
          type: "issue",
          catalogItemId: line.catalogItemId,
          locationId: line.sourceLocationId,
          qty: line.qty.neg(),
          createdById: input.signedById ?? null,
        },
      });
      movements.push(movement);
    }

    const cafeIssue = await tx.cafeIssue.update({
      where: { id: doc.id },
      data: {
        status: "received",
        signatureData: parsedSig.data,
        signedAt,
        signedById: input.signedById ?? null,
      },
    });

    return { ok: true as const, cafeIssue, movements };
  });
}
