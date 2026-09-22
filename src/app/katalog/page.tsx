import { AppHeader } from "@/components/app-header";
import { CatalogSearchList } from "@/components/catalog-search-list";
import { auth } from "@/auth";
import { CATALOG_WRITE_ROLES } from "@/server/catalog/roles";
import { redirect } from "next/navigation";

export default async function KatalogPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (CATALOG_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Katalog" />
      <CatalogSearchList canWrite={canWrite} />
    </div>
  );
}
