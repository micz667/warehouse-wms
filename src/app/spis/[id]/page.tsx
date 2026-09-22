import { AppHeader } from "@/components/app-header";
import { StocktakeSessionPanel } from "@/components/stocktake-session-panel";
import { auth } from "@/auth";
import { STOCKTAKE_WRITE_ROLES } from "@/server/stocktake/roles";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function SpisDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const { id } = await params;
  const canWrite = (STOCKTAKE_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Sesja spisu" />
      <StocktakeSessionPanel sessionId={id} canWrite={canWrite} />
    </div>
  );
}
