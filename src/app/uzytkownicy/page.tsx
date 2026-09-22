import { AppHeader } from "@/components/app-header";
import { UserAdminPanel } from "@/components/user-admin-panel";
import { auth } from "@/auth";
import { USER_READ_ROLES } from "@/server/users/roles";
import { redirect } from "next/navigation";

export default async function UzytkownicyPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  if (!(USER_READ_ROLES as readonly string[]).includes(session.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Użytkownicy" />
      <UserAdminPanel />
    </div>
  );
}
