import type { PrismaClient, StocktakeKind, StocktakeSession } from "@prisma/client";

export type CreateStocktakeSessionInput = {
  note?: string | null;
  createdById?: string | null;
  /** Default `opening` (F005). Pass `inventory` for variance sessions (F017). */
  kind?: StocktakeKind;
};

export type CreateStocktakeSessionResult =
  | { ok: true; session: StocktakeSession }
  | { ok: false; error: "validation"; message: string };

const KINDS = new Set<StocktakeKind>(["opening", "inventory"]);

/**
 * Opens a draft stocktake (`spis z natury`) or inventory session.
 * Lines and approval follow.
 */
export async function createStocktakeSession(
  db: PrismaClient,
  input: CreateStocktakeSessionInput = {},
): Promise<CreateStocktakeSessionResult> {
  const note =
    typeof input.note === "string" && input.note.trim().length > 0
      ? input.note.trim()
      : null;

  const kind = input.kind ?? "opening";
  if (!KINDS.has(kind)) {
    return {
      ok: false,
      error: "validation",
      message: "Nieprawidłowy rodzaj sesji",
    };
  }

  const session = await db.stocktakeSession.create({
    data: {
      status: "draft",
      kind,
      note,
      createdById: input.createdById ?? null,
    },
  });

  return { ok: true, session };
}
