import { AppHeader } from "@/components/app-header";
import { LocationCreateForm } from "@/components/location-create-form";
import { auth } from "@/auth";
import { LOCATION_WRITE_ROLES } from "@/server/locations/roles";
import { redirect } from "next/navigation";

export default async function LokalizacjeNowaPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  if (!(LOCATION_WRITE_ROLES as readonly string[]).includes(session.user.role)) {
    redirect("/lokalizacje");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Nowa lokalizacja" />
      <LocationCreateForm />
    </div>
  );
}
