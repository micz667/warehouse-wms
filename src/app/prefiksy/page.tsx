import { AppHeader } from "@/components/app-header";
import { CategoryPrefixPanel } from "@/components/category-prefix-panel";
import { auth } from "@/auth";
import { CATEGORY_PREFIX_ADMIN_ROLES } from "@/server/category-prefixes/roles";
import { redirect } from "next/navigation";

export default async function PrefiksyPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  if (
    !(CATEGORY_PREFIX_ADMIN_ROLES as readonly string[]).includes(
      session.user.role,
    )
  ) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Prefiksy" />
      <CategoryPrefixPanel />
    </div>
  );
}
