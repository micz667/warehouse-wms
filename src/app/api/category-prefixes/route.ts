import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listCategoryPrefixes } from "@/server/category-prefixes/list-category-prefixes";
import { CATEGORY_PREFIX_ADMIN_ROLES } from "@/server/category-prefixes/roles";
import { gateRole } from "@/server/gate-role";

export async function GET() {
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

  const rows = await listCategoryPrefixes(prisma);
  return Response.json({ rows });
}
