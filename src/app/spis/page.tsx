import { AppHeader } from "@/components/app-header";
import { StocktakeSessionList } from "@/components/stocktake-session-list";
import { auth } from "@/auth";
import { STOCKTAKE_WRITE_ROLES } from "@/server/stocktake/roles";
import { redirect } from "next/navigation";

export default async function SpisPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (STOCKTAKE_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Spis z natury" />
      <StocktakeSessionList canWrite={canWrite} />
    </div>
  );
}
