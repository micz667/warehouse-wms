import Link from "next/link";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { ROLE_LABEL_PL, shellBlurbForRole } from "@/lib/role-labels";
import { CATALOG_WRITE_ROLES } from "@/server/catalog/roles";
import { LOCATION_WRITE_ROLES } from "@/server/locations/roles";
import {
  MOVEMENT_AUDIT_ROLES,
  MOVEMENT_WRITE_ROLES,
} from "@/server/movements/roles";
import {
  SHOPPING_LIST_CREATE_ROLES,
  SHOPPING_LIST_READ_ROLES,
} from "@/server/shopping-lists/roles";
import { STOCKTAKE_WRITE_ROLES } from "@/server/stocktake/roles";
import { USER_READ_ROLES } from "@/server/users/roles";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role;
  const roleLabel = ROLE_LABEL_PL[role];
  const canWriteCatalog = (CATALOG_WRITE_ROLES as readonly string[]).includes(
    role,
  );
  const canWriteLocations = (LOCATION_WRITE_ROLES as readonly string[]).includes(
    role,
  );
  const canWriteStocktake = (
    STOCKTAKE_WRITE_ROLES as readonly string[]
  ).includes(role);
  const canWriteMovements = (
    MOVEMENT_WRITE_ROLES as readonly string[]
  ).includes(role);
  const canReadShoppingLists = (
    SHOPPING_LIST_READ_ROLES as readonly string[]
  ).includes(role);
  const canCreateShoppingLists = (
    SHOPPING_LIST_CREATE_ROLES as readonly string[]
  ).includes(role);
  const canManageUsers = (USER_READ_ROLES as readonly string[]).includes(role);
  const canAuditMovements = (
    MOVEMENT_AUDIT_ROLES as readonly string[]
  ).includes(role);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Magazyn
          </span>
          <span className="text-sm text-zinc-800">
            Rola: <strong className="font-semibold">{roleLabel}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-zinc-600 sm:inline">
            {session.user.email}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <h1 className="max-w-xl text-center text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
          Warehouse WMS
        </h1>
        <p className="mt-4 max-w-md text-center text-lg leading-relaxed text-zinc-600">
          {shellBlurbForRole(role)}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/ruchy"
            className="rounded bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Ruchy
          </Link>
          <Link
            href="/katalog"
            className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Katalog
          </Link>
          <Link
            href="/lokalizacje"
            className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Lokalizacje
          </Link>
          <Link
            href="/spis"
            className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Spis z natury
          </Link>
          <Link
            href="/stany"
            className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Stany
          </Link>
          {canReadShoppingLists ? (
            <Link
              href="/zakupy"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Listy zakupów
            </Link>
          ) : null}
          {canWriteMovements ? (
            <Link
              href="/ruchy/przyjecie"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Przyjęcie
            </Link>
          ) : null}
          {canWriteCatalog ? (
            <Link
              href="/katalog/nowy"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Nowa pozycja
            </Link>
          ) : null}
          {canWriteLocations ? (
            <Link
              href="/lokalizacje/nowa"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Nowa lokalizacja
            </Link>
          ) : null}
          {canWriteStocktake ? (
            <Link
              href="/spis"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Nowy spis
            </Link>
          ) : null}
          {canCreateShoppingLists ? (
            <Link
              href="/zakupy"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Nowa lista zakupów
            </Link>
          ) : null}
          {canManageUsers ? (
            <Link
              href="/uzytkownicy"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Użytkownicy
            </Link>
          ) : null}
          {canAuditMovements ? (
            <Link
              href="/audyt"
              className="rounded border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Audyt ruchów
            </Link>
          ) : null}
        </div>
      </main>
    </div>
  );
}
