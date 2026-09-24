import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Lightweight handoff for renovation returns (F016 owns the real gesture).
 * Reachable from the magazynier scan hub so it is not buried in settings.
 */
export default async function RenowacjaPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Renowacja" />
      <main className="mx-auto w-full max-w-lg px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Renowacja
        </h1>
        <p className="mt-2 text-zinc-600">
          Zwroty do sekcji renowacji i późniejsze wydanie do dostawcy będą
          osobnym gestem hali (kolejny etap). Tu tylko skrót z huba skanu.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-zinc-800">
          <li>
            <Link href="/" className="underline hover:text-zinc-950">
              Wróć do huba skanu
            </Link>
          </li>
          <li>
            <Link
              href="/ruchy/przesuniecie"
              className="underline hover:text-zinc-950"
            >
              Tymczasowo: przenieś towar na lokalizację renowacji (F007)
            </Link>
          </li>
          <li>
            <Link href="/stany" className="underline hover:text-zinc-950">
              Zobacz stany
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
