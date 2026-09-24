import { AppHeader } from "@/components/app-header";
import { GoodReturnForm } from "@/components/good-return-form";
import { auth } from "@/auth";
import { loadHubPrefill } from "@/lib/load-hub-prefill";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    itemId?: string;
    locationId?: string;
    fromHub?: string;
  }>;
};

export default async function ZwrotPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (MOVEMENT_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );
  const params = await searchParams;
  const prefill = await loadHubPrefill(params);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Zwrot" />
      <GoodReturnForm
        canWrite={canWrite}
        initialItem={prefill.item}
        initialLocation={prefill.location}
        fromHub={prefill.fromHub}
      />
    </div>
  );
}
