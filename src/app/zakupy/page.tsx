import { AppHeader } from "@/components/app-header";
import { ShoppingListIndex } from "@/components/shopping-list-index";
import { auth } from "@/auth";
import {
  SHOPPING_LIST_CREATE_ROLES,
  SHOPPING_LIST_FULFILL_ROLES,
  SHOPPING_LIST_HISTORY_ROLES,
  SHOPPING_LIST_READ_ROLES,
} from "@/server/shopping-lists/roles";
import { redirect } from "next/navigation";

export default async function ZakupyPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role;
  if (!(SHOPPING_LIST_READ_ROLES as readonly string[]).includes(role)) {
    redirect("/");
  }

  const canCreate = (SHOPPING_LIST_CREATE_ROLES as readonly string[]).includes(
    role,
  );
  const canFulfill = (
    SHOPPING_LIST_FULFILL_ROLES as readonly string[]
  ).includes(role);
  const canViewHistory = (
    SHOPPING_LIST_HISTORY_ROLES as readonly string[]
  ).includes(role);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Listy zakupów" />
      <ShoppingListIndex
        canCreate={canCreate}
        canFulfill={canFulfill}
        canViewHistory={canViewHistory}
      />
    </div>
  );
}
