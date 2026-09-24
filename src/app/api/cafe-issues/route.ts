import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { getCafeIssue } from "@/server/cafe-issues/get-cafe-issue";
import { listCafeIssues } from "@/server/cafe-issues/list-cafe-issues";
import { prepareCafeIssue } from "@/server/cafe-issues/prepare-cafe-issue";
import {
  CAFE_ISSUE_READ_ROLES,
  CAFE_ISSUE_WRITE_ROLES,
} from "@/server/cafe-issues/roles";
import {
  serializeCafeIssue,
  serializeCafeIssueListRow,
} from "@/server/cafe-issues/serialize-cafe-issue";

export async function GET() {
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

  const rows = await listCafeIssues(prisma, { statuses: ["prepared"] });
  return Response.json({
    cafeIssues: rows.map(serializeCafeIssueListRow),
  });
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const linesRaw = Array.isArray(record.lines) ? record.lines : [];
  const lines = linesRaw.map((row) => {
    const line =
      row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    return {
      catalogItemId:
        typeof line.catalogItemId === "string" ? line.catalogItemId : "",
      sourceLocationId:
        typeof line.sourceLocationId === "string"
          ? line.sourceLocationId
          : "",
      qty: line.qty,
    };
  });

  const result = await prepareCafeIssue(prisma, {
    cafeLocationId:
      typeof record.cafeLocationId === "string" ? record.cafeLocationId : "",
    note: typeof record.note === "string" ? record.note : null,
    createdById: session?.user?.id ?? null,
    lines,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "empty"
          ? 400
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  const full = await getCafeIssue(prisma, result.cafeIssue.id);
  if (!full) {
    return Response.json(
      { error: "Nie udało się wczytać przygotowanego dokumentu" },
      { status: 500 },
    );
  }

  return Response.json({ cafeIssue: serializeCafeIssue(full) }, { status: 201 });
}
