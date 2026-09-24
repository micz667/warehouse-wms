import { AppHeader } from "@/components/app-header";
import { LocateItem } from "@/components/locate-item";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ itemId?: string }>;
};

export default async function GdziePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const params = await searchParams;
  let initialItem = null;
  if (params.itemId) {
    const row = await prisma.catalogItem.findUnique({
      where: { id: params.itemId },
    });
    if (row) {
      initialItem = {
        id: row.id,
        sku: row.sku,
        name: row.name,
        barcode: row.barcode,
        unit: row.unit,
      };
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Gdzie leży?" />
      <LocateItem initialItem={initialItem} />
    </div>
  );
}
