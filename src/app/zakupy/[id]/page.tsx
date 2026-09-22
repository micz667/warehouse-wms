import { AppHeader } from "@/components/app-header";
import { ShoppingListPanel } from "@/components/shopping-list-panel";
import { auth } from "@/auth";
import {
  SHOPPING_LIST_CREATE_ROLES,
  SHOPPING_LIST_FULFILL_ROLES,
  SHOPPING_LIST_READ_ROLES,
} from "@/server/shopping-lists/roles";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function ZakupyDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role;
  if (!(SHOPPING_LIST_READ_ROLES as readonly string[]).includes(role)) {
    redirect("/");
  }

  const { id } = await params;
  const canCreate = (SHOPPING_LIST_CREATE_ROLES as readonly string[]).includes(
    role,
  );
  const canFulfill = (
    SHOPPING_LIST_FULFILL_ROLES as readonly string[]
  ).includes(role);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Lista zakupów" />
      <ShoppingListPanel
        listId={id}
        canCreate={canCreate}
        canFulfill={canFulfill}
      />
    </div>
  );
}
