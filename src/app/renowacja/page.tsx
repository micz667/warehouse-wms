import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";
import { redirect } from "next/navigation";

/**
 * Renovation hall hub (F016): distinct path from good return (Zwrot).
 * Return damaged goods into the section, or batch-issue to vendor later.
 */
export default async function RenowacjaPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (MOVEMENT_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Renowacja" />
      <main className="mx-auto w-full max-w-lg px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Renowacja
        </h1>
        <p className="mt-2 text-zinc-600">
          Uszkodzony lub brudny zwrot trafia do sekcji renowacji. Później
          partia wychodzi do dostawcy. Dobry zwrot na półkę to osobny gest —
          Zwrot.
        </p>
        {!canWrite ? (
          <p className="mt-4 text-sm text-amber-800" role="status">
            Podgląd — zapis ruchów tylko dla magazyniera i administratora.
          </p>
        ) : null}
        <ul className="mt-8 divide-y divide-zinc-200 border-t border-zinc-200">
          <li>
            <Link
              href="/renowacja/zwrot"
              className="block py-4 hover:bg-zinc-50"
              data-testid="renovation-hub-return"
            >
              <p className="font-medium text-zinc-900">Zwrot do renowacji</p>
              <p className="mt-0.5 text-sm text-zinc-600">
                Skan → ilość → lokalizacja sekcji renowacji.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/renowacja/wydanie"
              className="block py-4 hover:bg-zinc-50"
              data-testid="renovation-hub-vendor-issue"
            >
              <p className="font-medium text-zinc-900">Wydanie do dostawcy</p>
              <p className="mt-0.5 text-sm text-zinc-600">
                Partia z renowacji — stan zejdzie z aktorem i czasem.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/ruchy/zwrot"
              className="block py-4 hover:bg-zinc-50"
              data-testid="renovation-hub-good-return"
            >
              <p className="font-medium text-zinc-900">Zwrot na półkę</p>
              <p className="mt-0.5 text-sm text-zinc-600">
                Dobry zwrot — osobny gest, nie ta sama ścieżka.
              </p>
            </Link>
          </li>
          <li>
            <Link href="/gdzie" className="block py-4 hover:bg-zinc-50">
              <p className="font-medium text-zinc-900">Gdzie leży?</p>
              <p className="mt-0.5 text-sm text-zinc-600">
                Stan w renowacji widać jak na każdej lokalizacji.
              </p>
            </Link>
          </li>
          <li>
            <Link href="/" className="block py-4 hover:bg-zinc-50">
              <p className="font-medium text-zinc-900">Hub skanu</p>
              <p className="mt-0.5 text-sm text-zinc-600">Wróć do hali.</p>
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
