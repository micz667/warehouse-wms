import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { postVendorIssueBatch } from "@/server/movements/post-vendor-issue-batch";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";

type LineBody = {
  catalogItemId?: string;
  locationId?: string;
  qty?: unknown;
};

type Body = {
  lines?: LineBody[];
  note?: string | null;
};

/** Batch vendor issue from renovation-section stock. */
export async function POST(request: Request) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, MOVEMENT_WRITE_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Nieprawidłowe ciało żądania" }, { status: 400 });
  }

  const result = await postVendorIssueBatch(prisma, {
    lines: (body.lines ?? []).map((line) => ({
      catalogItemId: line.catalogItemId ?? "",
      locationId: line.locationId ?? "",
      qty: line.qty,
    })),
    note: body.note,
    createdById: session?.user?.id ?? null,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "insufficient_stock" ||
            result.error === "not_renovation"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({
    movements: result.movements.map((m) => ({
      ...m,
      qty: m.qty.toString(),
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
