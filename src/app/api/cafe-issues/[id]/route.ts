import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { getCafeIssue } from "@/server/cafe-issues/get-cafe-issue";
import { CAFE_ISSUE_READ_ROLES } from "@/server/cafe-issues/roles";
import { serializeCafeIssue } from "@/server/cafe-issues/serialize-cafe-issue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, CAFE_ISSUE_READ_ROLES);
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
  const doc = await getCafeIssue(prisma, id);
  if (!doc) {
    return Response.json(
      { error: "Nie znaleziono dokumentu wydania" },
      { status: 404 },
    );
  }

  return Response.json({ cafeIssue: serializeCafeIssue(doc) });
}
