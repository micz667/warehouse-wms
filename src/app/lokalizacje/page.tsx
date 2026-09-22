import { AppHeader } from "@/components/app-header";
import { LocationSearchList } from "@/components/location-search-list";
import { auth } from "@/auth";
import { LOCATION_WRITE_ROLES } from "@/server/locations/roles";
import { redirect } from "next/navigation";

export default async function LokalizacjePage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (LOCATION_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Lokalizacje" />
      <LocationSearchList canWrite={canWrite} />
    </div>
  );
}
