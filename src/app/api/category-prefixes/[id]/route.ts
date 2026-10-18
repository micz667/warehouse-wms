import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_PREFIX_ADMIN_ROLES } from "@/server/category-prefixes/roles";
import { updateCategoryPrefix } from "@/server/category-prefixes/update-category-prefix";
import { gateRole } from "@/server/gate-role";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, CATEGORY_PREFIX_ADMIN_ROLES);
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

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const { id } = await context.params;
  const result = await updateCategoryPrefix(
    prisma,
    id,
    typeof record.prefix === "string" ? record.prefix : "",
  );

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "prefix_taken" || result.error === "prefix_in_use"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({ row: result.row });
}
