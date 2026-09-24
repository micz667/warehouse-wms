import type { CafeIssue, Movement, PrismaClient } from "@prisma/client";
import { sumMovementQty } from "@/server/stock/sum-movement-qty";

export type EmergencyIssueCafeIssueInput = {
  cafeIssueId: string;
  /** Must be true — conscious confirm, not a silent auto-issue. */
  confirmed: unknown;
  /** Non-empty reason/note for the emergency bypass. */
  emergencyNote: unknown;
  issuedById?: string | null;
};

export type EmergencyIssueCafeIssueResult =
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

function parseEmergencyNote(raw: unknown):
  | { ok: true; note: string }
  | { ok: false; message: string } {
  if (typeof raw !== "string" || !raw.trim()) {
    return {
      ok: false,
      message: "Podaj powód wydania awaryjnego (bez podpisu)",
    };
  }
  const note = raw.trim();
  if (note.length < 3) {
    return {
      ok: false,
      message: "Powód jest za krótki — opisz sytuację awaryjną",
    };
  }
  return { ok: true, note };
}

/**
 * Conscious emergency bypass of cafe finger signature (F018).
 * Posts the same issue movements as signCafeIssue, marks signature skipped
 * with actor + reason, and leaves the document as received (not prepared).
 */
export async function emergencyIssueCafeIssue(
  db: PrismaClient,
  input: EmergencyIssueCafeIssueInput,
): Promise<EmergencyIssueCafeIssueResult> {
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

  if (input.confirmed !== true) {
    return {
      ok: false,
      error: "validation",
      message:
        "Wymagane świadome potwierdzenie wydania awaryjnego bez podpisu",
    };
  }

  const parsedNote = parseEmergencyNote(input.emergencyNote);
  if (!parsedNote.ok) {
    return { ok: false, error: "validation", message: parsedNote.message };
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
            ? "Dokument jest już zamknięty — wydanie awaryjne zablokowane"
            : "Wydać awaryjnie można tylko przygotowaną paczkę (w drodze)",
      };
    }

    if (doc.lines.length === 0) {
      return {
        ok: false as const,
        error: "empty" as const,
        message: "Nie można wydać pustej paczki",
      };
    }

    const issuedAt = new Date();
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
          createdById: input.issuedById ?? null,
        },
      });
      movements.push(movement);
    }

    const cafeIssue = await tx.cafeIssue.update({
      where: { id: doc.id },
      data: {
        status: "received",
        signatureData: null,
        signatureSkipped: true,
        emergencyNote: parsedNote.note,
        signedAt: issuedAt,
        signedById: input.issuedById ?? null,
      },
    });

    return { ok: true as const, cafeIssue, movements };
  });
}
