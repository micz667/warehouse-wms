import { AppHeader } from "@/components/app-header";
import { ReceiptForm } from "@/components/receipt-form";
import { auth } from "@/auth";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";
import { redirect } from "next/navigation";

export default async function PrzyjeciePage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (MOVEMENT_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Przyjęcie" />
      <ReceiptForm canWrite={canWrite} />
    </div>
  );
}
