import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { MOVEMENT_WRITE_ROLES } from "@/server/movements/roles";
import { redirect } from "next/navigation";

const FLOWS = [
  {
    href: "/ruchy/przyjecie",
    title: "Przyjęcie",
    blurb: "Towar na lokalizację — zwiększa stan.",
  },
  {
    href: "/ruchy/przesuniecie",
    title: "Przesunięcie",
    blurb: "Z lokalizacji na lokalizację — para ruchów transfer.",
  },
  {
    href: "/ruchy/wydanie",
    title: "Wydanie",
    blurb: "Z lokalizacji — odmawia przy ujemnym stanie.",
  },
  {
    href: "/ruchy/historia",
    title: "Historia",
    blurb: "Ostatnie ruchy z aktorem i czasem.",
  },
] as const;

export default async function RuchyPage() {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const canWrite = (MOVEMENT_WRITE_ROLES as readonly string[]).includes(
    session.user.role,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Ruchy" />
      <main className="mx-auto w-full max-w-lg px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Ruchy magazynowe
        </h1>
        <p className="mt-1 text-zinc-600">
          Skan przyjęć, przesunięć i wydań na hali
          {canWrite ? "" : " (podgląd)"}
          .
        </p>
        <ul className="mt-8 divide-y divide-zinc-200 border-t border-zinc-200">
          {FLOWS.map((flow) => (
            <li key={flow.href}>
              <Link
                href={flow.href}
                className="block py-4 hover:bg-zinc-50"
              >
                <p className="font-medium text-zinc-900">{flow.title}</p>
                <p className="mt-0.5 text-sm text-zinc-600">{flow.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
