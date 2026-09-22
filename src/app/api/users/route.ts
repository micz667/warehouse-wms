import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gateRole } from "@/server/gate-role";
import { createUser } from "@/server/users/create-user";
import { listUsers } from "@/server/users/list-users";
import { isValidRole, USER_READ_ROLES, USER_WRITE_ROLES } from "@/server/users/roles";

export async function GET() {
  const session = await auth();
  const gate = gateRole(session?.user?.role, USER_READ_ROLES);
  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  const users = await listUsers(prisma);
  return Response.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
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
  const roleRaw = record.role;
  if (!isValidRole(roleRaw)) {
    return Response.json({ error: "Nieprawidłowa rola" }, { status: 400 });
  }

  const result = await createUser(prisma, {
    email: typeof record.email === "string" ? record.email : "",
    password: typeof record.password === "string" ? record.password : "",
    name: typeof record.name === "string" ? record.name : null,
    role: roleRaw,
  });

  if (!result.ok) {
    const status =
      result.error === "validation"
        ? 400
        : result.error === "email_taken"
          ? 409
          : 400;
    return Response.json({ error: result.message }, { status });
  }

  return Response.json(
    {
      user: {
        ...result.user,
        createdAt: result.user.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
