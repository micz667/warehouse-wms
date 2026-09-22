import type { PrismaClient, StocktakeSession } from "@prisma/client";

export type CreateStocktakeSessionInput = {
  note?: string | null;
  createdById?: string | null;
};

export type CreateStocktakeSessionResult =
  | { ok: true; session: StocktakeSession }
  | { ok: false; error: "validation"; message: string };

/**
 * Opens a draft stocktake (`spis z natury`). Lines and approval follow.
 */
export async function createStocktakeSession(
  db: PrismaClient,
  input: CreateStocktakeSessionInput = {},
): Promise<CreateStocktakeSessionResult> {
  const note =
    typeof input.note === "string" && input.note.trim().length > 0
      ? input.note.trim()
      : null;

  const session = await db.stocktakeSession.create({
    data: {
      status: "draft",
      note,
      createdById: input.createdById ?? null,
    },
  });

  return { ok: true, session };
}
