import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { getCafeIssue } from "@/server/cafe-issues/get-cafe-issue";
import { CAFE_ISSUE_WRITE_ROLES } from "@/server/cafe-issues/roles";
import { serializeCafeIssue } from "@/server/cafe-issues/serialize-cafe-issue";
import { signCafeIssue } from "@/server/cafe-issues/sign-cafe-issue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * On-site finger signature → post issue movements (F013b).
 * Magazynier + admin (same write roles as prepare / issue).
 */
export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, CAFE_ISSUE_WRITE_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const result = await signCafeIssue(prisma, {
    cafeIssueId: id,
    signatureData: record.signatureData,
    signedById: session?.user?.id ?? null,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "insufficient_stock"
          ? 409
          : result.error === "invalid_status"
            ? 409
            : 400;
    return Response.json({ error: result.message }, { status });
  }

  const full = await getCafeIssue(prisma, result.cafeIssue.id);
  if (!full) {
    return Response.json(
      { error: "Nie udało się wczytać podpisanego dokumentu" },
      { status: 500 },
    );
  }

  return Response.json({
    cafeIssue: serializeCafeIssue(full),
    movementCount: result.movements.length,
  });
}
