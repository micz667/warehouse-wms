import { AppHeader } from "@/components/app-header";
import { CatalogCreateForm } from "@/components/catalog-create-form";
import { auth } from "@/auth";
import { CATALOG_WRITE_ROLES } from "@/server/catalog/roles";
import { redirect } from "next/navigation";

export default async function KatalogNowyPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  if (!(CATALOG_WRITE_ROLES as readonly string[]).includes(session.user.role)) {
    redirect("/katalog");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nowa pozycja" />
      <CatalogCreateForm />
    </div>
  );
}
