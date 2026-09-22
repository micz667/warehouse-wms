"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { SHOPPING_LIST_STATUS_LABEL_PL } from "@/lib/shopping-list-labels";

type ListRow = {
  id: string;
  status: keyof typeof SHOPPING_LIST_STATUS_LABEL_PL;
  title: string | null;
  note: string | null;
  createdAt: string;
  submittedAt: string | null;
  doneAt: string | null;
  _count: { lines: number };
};

type Props = {
  canCreate: boolean;
  canFulfill: boolean;
  canViewHistory: boolean;
};

export function ShoppingListIndex({
  canCreate,
  canFulfill,
  canViewHistory,
}: Props) {
  const router = useRouter();
  const [lists, setLists] = useState<ListRow[]>([]);
  const [history, setHistory] = useState<ListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const primaryScope = canFulfill && !canCreate ? "fulfill" : "";
      const res = await fetch(
        primaryScope
          ? `/api/shopping-lists?scope=${primaryScope}`
          : "/api/shopping-lists",
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać list");
        return;
      }
      const data = (await res.json()) as { lists: ListRow[] };
      setLists(data.lists);

      if (canViewHistory) {
        const histRes = await fetch("/api/shopping-lists?scope=history");
        if (histRes.ok) {
          const histData = (await histRes.json()) as { lists: ListRow[] };
          setHistory(histData.lists);
        }
      }
    });
  }, [canCreate, canFulfill, canViewHistory]);

  useEffect(() => {
    load();
  }, [load]);

  async function createList() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/shopping-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = (await res.json().catch(() => null)) as {
        list?: { id: string };
        error?: string;
      } | null;
      if (!res.ok || !body?.list) {
        setError(body?.error ?? "Nie udało się utworzyć listy");
        return;
      }
      router.push(`/zakupy/${body.list.id}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  const active = canViewHistory
    ? lists.filter((l) => l.status === "draft" || l.status === "submitted")
    : lists;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Listy zakupów
          </h1>
          <p className="mt-1 text-zinc-600">
            {canCreate
              ? "Buduj szkic z katalogu, prześlij na halę — magazyn odhacza pozycje."
              : "Przesłane listy do realizacji — odhacz pozycje na hali."}
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={createList}
            disabled={creating}
            className="inline-flex items-center justify-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {creating ? "Tworzenie…" : "Nowa lista"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {canFulfill && !canCreate ? "Do realizacji" : "Aktywne"}
        </h2>
        {pending && active.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Wczytywanie…</p>
        ) : active.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Brak list.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 border-t border-zinc-200">
            {active.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/zakupy/${list.id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {list.title?.trim() || `Lista ${list.id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {SHOPPING_LIST_STATUS_LABEL_PL[list.status]} ·{" "}
                      {list._count.lines} poz.
                    </p>
                  </div>
                  <span className="text-sm text-zinc-500">Otwórz</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canViewHistory ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Historia
          </h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Brak historii.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-200 border-t border-zinc-200">
              {history.map((list) => (
                <li key={list.id}>
                  <Link
                    href={`/zakupy/${list.id}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-zinc-50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">
                        {list.title?.trim() || `Lista ${list.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-zinc-600">
                        {SHOPPING_LIST_STATUS_LABEL_PL[list.status]} ·{" "}
                        {list._count.lines} poz.
                      </p>
                    </div>
                    <span className="text-sm text-zinc-500">Otwórz</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
