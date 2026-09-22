import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { ROLE_LABEL_PL, shellBlurbForRole } from "@/lib/role-labels";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const role = session.user.role;
  const roleLabel = ROLE_LABEL_PL[role];

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
      </main>
    </div>
  );
}
