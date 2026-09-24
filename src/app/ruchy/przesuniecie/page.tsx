import { AppHeader } from "@/components/app-header";
import { TransferForm } from "@/components/transfer-form";
import { auth } from "@/auth";
import { loadHubPrefill } from "@/lib/load-hub-prefill";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    itemId?: string;
    fromLocationId?: string;
    toLocationId?: string;
    fromHub?: string;
  }>;
};

export default async function PrzesunieciePage({ searchParams }: PageProps) {
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
      <AppHeader title="Przenieś" />
      <TransferForm
        canWrite={canWrite}
        initialItem={prefill.item}
        initialFrom={prefill.fromLocation}
        initialTo={prefill.toLocation}
        fromHub={prefill.fromHub}
      />
    </div>
  );
}
