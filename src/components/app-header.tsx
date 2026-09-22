import Link from "next/link";
import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { ROLE_LABEL_PL } from "@/lib/role-labels";
import { redirect } from "next/navigation";

type Props = {
  title?: string;
};

export async function AppHeader({ title }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const roleLabel = ROLE_LABEL_PL[session.user.role];

  return (
    <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
      <div className="flex items-baseline gap-3">
        <Link
          href="/"
          className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-800"
        >
          Magazyn
        </Link>
        {title ? (
          <span className="text-sm font-medium text-zinc-800">{title}</span>
        ) : null}
        <span className="hidden text-sm text-zinc-600 sm:inline">
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
  );
}
