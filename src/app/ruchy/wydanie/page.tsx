import { AppHeader } from "@/components/app-header";
import { CafePrepareForm } from "@/components/cafe-prepare-form";
import { auth } from "@/auth";
import { loadHubPrefill } from "@/lib/load-hub-prefill";
import { CAFE_ISSUE_WRITE_ROLES } from "@/server/cafe-issues/roles";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{
    itemId?: string;
    locationId?: string;
    fromHub?: string;
  }>;
};

export default async function WydaniePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (CAFE_ISSUE_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );
  const params = await searchParams;
  const prefill = await loadHubPrefill(params);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Wydanie do kawiarni" />
      <CafePrepareForm
        canWrite={canWrite}
        initialItem={prefill.item}
        initialSource={prefill.location}
        fromHub={prefill.fromHub}
      />
    </div>
  );
}
