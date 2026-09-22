import { AppHeader } from "@/components/app-header";
import { MovementHistoryList } from "@/components/movement-history-list";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HistoriaRuchowPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Historia ruchów" />
      <MovementHistoryList />
    </div>
  );
}
