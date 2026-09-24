import { AppHeader } from "@/components/app-header";
import { VendorIssueForm } from "@/components/vendor-issue-form";
import { auth } from "@/auth";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";
import { redirect } from "next/navigation";

export default async function RenowacjaWydaniePage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (MOVEMENT_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Wydanie do dostawcy" />
      <VendorIssueForm canWrite={canWrite} />
    </div>
  );
}
