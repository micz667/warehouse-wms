import { AppHeader } from "@/components/app-header";
import { StockBalanceList } from "@/components/stock-balance-list";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function StanyPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Stany" />
      <StockBalanceList />
    </div>
  );
}
