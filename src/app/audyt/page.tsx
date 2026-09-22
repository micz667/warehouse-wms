import { AppHeader } from "@/components/app-header";
import { MovementHistoryList } from "@/components/movement-history-list";
import { auth } from "@/auth";
import { MOVEMENT_AUDIT_ROLES } from "@/server/movements/roles";
import { redirect } from "next/navigation";

export default async function AudytRuchowPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  if (
    !(MOVEMENT_AUDIT_ROLES as readonly string[]).includes(session.user.role)
  ) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Audyt ruchów" />
      <MovementHistoryList showFilters />
    </div>
  );
}
