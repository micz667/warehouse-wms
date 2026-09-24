import { AppHeader } from "@/components/app-header";
import { MovementHistoryList } from "@/components/movement-history-list";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ catalogItemId?: string }>;
};

export default async function HistoriaRuchowPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const params = await searchParams;
  let productFilter: { id: string; sku: string; name: string } | null = null;
  if (params.catalogItemId) {
    const row = await prisma.catalogItem.findUnique({
      where: { id: params.catalogItemId },
      select: { id: true, sku: true, name: true },
    });
    if (row) {
      productFilter = row;
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        title={productFilter ? "Historia pozycji" : "Historia ruchów"}
      />
      <MovementHistoryList
        initialCatalogItemId={productFilter?.id}
        productLabel={
          productFilter
            ? `${productFilter.name} (${productFilter.sku})`
            : undefined
        }
      />
    </div>
  );
}
