import { auth } from "@/auth";
import { gateRole } from "@/server/gate-role";

/** Sample admin-only route: 401 without session, 403 without admin role. */
export async function GET() {
  const session = await auth();
  const gate = gateRole(session?.user?.role, ["admin"]);

  if (!gate.ok) {
    return Response.json(
      {
        error:
          gate.status === 401 ? "Wymagane logowanie" : "Brak uprawnień",
      },
      { status: gate.status },
    );
  }

  return Response.json({
    ok: true,
    message: "Dostęp administratora potwierdzony",
    role: gate.role,
  });
}
