import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { isValidRole, USER_WRITE_ROLES } from "@/server/users/roles";
import { updateUserRole } from "@/server/users/update-user-role";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, USER_WRITE_ROLES);
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

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Nieprawidłowy JSON" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  if (!isValidRole(record.role)) {
    return Response.json({ error: "Nieprawidłowa rola" }, { status: 400 });
  }

  const result = await updateUserRole(prisma, {
    userId: id,
    role: record.role,
  });

  if (!result.ok) {
    const status =
      result.error === "not_found"
        ? 404
        : result.error === "validation"
          ? 400
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json({
    user: {
      ...result.user,
      updatedAt: result.user.updatedAt.toISOString(),
    },
  });
}
