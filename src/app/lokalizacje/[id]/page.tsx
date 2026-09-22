import { AppHeader } from "@/components/app-header";
import { LocationEditForm } from "@/components/location-edit-form";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { LOCATION_WRITE_ROLES } from "@/server/locations/roles";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function LokalizacjaPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const { id } = await params;
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) {
    notFound();
  }

  const canWrite = (LOCATION_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Lokalizacja" />
      <LocationEditForm location={location} canWrite={canWrite} />
    </div>
  );
}
