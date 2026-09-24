import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CAFE_ISSUE_STATUS_LABEL_PL } from "@/lib/cafe-issue-labels";
import { getCafeIssue } from "@/server/cafe-issues/get-cafe-issue";
import { CAFE_ISSUE_READ_ROLES } from "@/server/cafe-issues/roles";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CafeIssueDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }
  if (!(CAFE_ISSUE_READ_ROLES as readonly string[]).includes(session.user.role)) {
    redirect("/");
  }

  const { id } = await params;
  const doc = await getCafeIssue(prisma, id);
  if (!doc) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Paczka do kawiarni" />
      <main
        className="mx-auto w-full max-w-lg space-y-6 px-6 py-8"
        data-testid="cafe-issue-detail"
        data-cafe-issue-id={doc.id}
        data-status={doc.status}
      >
        <div>
          <p className="text-sm uppercase tracking-wide text-zinc-500">
            {CAFE_ISSUE_STATUS_LABEL_PL[doc.status]}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            {doc.cafeLocation.label}
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-600">
            {doc.cafeLocation.code}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Przygotowano{" "}
            {doc.preparedAt.toLocaleString("pl-PL")}
            {doc.note ? ` · ${doc.note}` : ""}
          </p>
        </div>

        <ul className="divide-y divide-zinc-200 border-t border-zinc-200">
          {doc.lines.map((line) => (
            <li key={line.id} className="py-3">
              <p className="font-medium text-zinc-900">{line.catalogItem.name}</p>
              <p className="font-mono text-xs text-zinc-600">
                {line.catalogItem.sku} · ze {line.sourceLocation.code} (
                {line.sourceLocation.label}) · {line.qty.toString()}{" "}
                {line.catalogItem.unit}
              </p>
            </li>
          ))}
        </ul>

        <p
          className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          Stan magazynu nie został jeszcze obniżony. Podpis odbioru (zejście ze
          stanu) — w kolejnym kroku.
        </p>

        <p className="text-sm">
          <Link href="/ruchy/wydanie" className="underline hover:text-zinc-900">
            ← Wróć do wydań
          </Link>
        </p>
      </main>
    </div>
  );
}
