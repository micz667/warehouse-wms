import Link from "next/link";
import { BarcodeLabel } from "@/components/barcode-label";
import { PrintButton } from "@/components/print-button";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function LokalizacjaEtykietaPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  const { id } = await params;
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 print:hidden">
        <Link
          href={`/lokalizacje/${location.id}`}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Wróć
        </Link>
        <PrintButton />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
          Magazyn · lokalizacja
        </p>
        <h1 className="mt-3 max-w-md text-center text-2xl font-semibold tracking-tight">
          {location.label}
        </h1>
        <p className="mt-1 font-mono text-sm text-zinc-600">{location.code}</p>
        <div className="mt-8 rounded border border-zinc-200 bg-white p-6">
          <BarcodeLabel value={location.code} height={72} />
        </div>
      </main>
    </div>
  );
}
