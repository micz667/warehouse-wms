import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATALOG_WRITE_ROLES } from "@/server/catalog/roles";
import { saveCatalogPhoto } from "@/server/catalog/save-catalog-photo";
import { updateCatalogItem } from "@/server/catalog/update-catalog-item";
import { gateRole } from "@/server/gate-role";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  const gate = gateRole(session?.user?.role, CATALOG_WRITE_ROLES);
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
  const existing = await prisma.catalogItem.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Pozycja nie istnieje" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Oczekiwano multipart/form-data" }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return Response.json({ error: "Brak pliku zdjęcia (pole photo)" }, { status: 400 });
  }

  const saved = await saveCatalogPhoto(id, file);
  if (!saved.ok) {
    return Response.json({ error: saved.message }, { status: 400 });
  }

  const result = await updateCatalogItem(prisma, id, {
    photoPath: saved.photoPath,
  });
  if (!result.ok) {
    return Response.json({ error: result.message }, { status: 400 });
  }

  return Response.json({ item: result.item });
}
