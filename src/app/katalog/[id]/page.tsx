import { AppHeader } from "@/components/app-header";
import { CatalogEditForm } from "@/components/catalog-edit-form";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CATALOG_WRITE_ROLES } from "@/server/catalog/roles";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function KatalogItemPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const { id } = await params;
  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) {
    notFound();
  }

  const canWrite = (CATALOG_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Pozycja" />
      <CatalogEditForm item={item} canWrite={canWrite} />
    </div>
  );
}
