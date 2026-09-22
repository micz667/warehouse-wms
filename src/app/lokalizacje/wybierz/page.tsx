import { AppHeader } from "@/components/app-header";
import { LocationPicker } from "@/components/location-picker";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/** Demo / seam page — later movement flows embed `LocationPicker` directly. */
export default async function LokalizacjeWybierzPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Wybór lokalizacji" />
      <LocationPicker />
    </div>
  );
}
