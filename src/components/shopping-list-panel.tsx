"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { SHOPPING_LIST_STATUS_LABEL_PL } from "@/lib/shopping-list-labels";

type CatalogHit = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  barcode: string;
};

type LineRow = {
  id: string;
  qty: string;
  note: string | null;
  checkedAt: string | null;
  catalogItem: CatalogHit;
};

type ListDetail = {
  id: string;
  status: keyof typeof SHOPPING_LIST_STATUS_LABEL_PL;
  title: string | null;
  note: string | null;
  submittedAt: string | null;
  doneAt: string | null;
  lines: LineRow[];
};

type Props = {
  listId: string;
  canCreate: boolean;
  canFulfill: boolean;
};

export function ShoppingListPanel({ listId, canCreate, canFulfill }: Props) {
  const router = useRouter();
  const [list, setList] = useState<ListDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const [itemQuery, setItemQuery] = useState("");
  const [itemHits, setItemHits] = useState<CatalogHit[]>([]);
  const [pickedItem, setPickedItem] = useState<CatalogHit | null>(null);
  const [qty, setQty] = useState("");
  const [lineNote, setLineNote] = useState("");

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/shopping-lists/${listId}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać listy");
        return;
      }
      const data = (await res.json()) as { list: ListDetail };
      setList(data.list);
    });
  }, [listId]);

  useEffect(() => {
    load();
  }, [load]);

  async function searchItems(q: string) {
    setItemQuery(q);
    if (!q.trim()) {
      setItemHits([]);
      return;
    }
    const res = await fetch(`/api/catalog?q=${encodeURIComponent(q.trim())}`);
    if (!res.ok) return;
    const data = (await res.json()) as { items: CatalogHit[] };
    setItemHits(data.items.slice(0, 8));
  }

  async function addLine(event: React.FormEvent) {
    event.preventDefault();
    if (!pickedItem) {
      setError("Wybierz pozycję katalogu");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: pickedItem.id,
          qty,
          note: lineNote.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się dodać pozycji");
        return;
      }
      setQty("");
      setLineNote("");
      setPickedItem(null);
      setItemQuery("");
      setItemHits([]);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function removeLine(lineId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/shopping-lists/${listId}/lines/${lineId}`,
        { method: "DELETE" },
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się usunąć pozycji");
        return;
      }
      load();
    } finally {
      setBusy(false);
    }
  }

  async function submitList() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/submit`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się przesłać listy");
        return;
      }
      load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function toggleChecked(line: LineRow) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/shopping-lists/${listId}/lines/${line.id}/check`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checked: !line.checkedAt }),
        },
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się oznaczyć pozycji");
        return;
      }
      load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function completeList() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/complete`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się zamknąć listy");
        return;
      }
      load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!list && !error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-sm text-zinc-500">Wczytywanie…</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
        <Link href="/zakupy" className="mt-4 inline-block text-sm text-zinc-700 underline">
          Wróć do list
        </Link>
      </div>
    );
  }

  const isDraft = list.status === "draft";
  const isSubmitted = list.status === "submitted";
  const canEditDraft = canCreate && isDraft;
  const canCheck = canFulfill && isSubmitted;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/zakupy" className="underline hover:text-zinc-800">
              Listy zakupów
            </Link>
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            {list.title?.trim() || `Lista ${list.id.slice(0, 8)}`}
          </h1>
          <p className="mt-1 text-zinc-600">
            Status: {SHOPPING_LIST_STATUS_LABEL_PL[list.status]}
            {list.note ? ` · ${list.note}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEditDraft ? (
            <button
              type="button"
              onClick={submitList}
              disabled={busy || list.lines.length === 0}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Prześlij na magazyn
            </button>
          ) : null}
          {canCheck ? (
            <button
              type="button"
              onClick={completeList}
              disabled={busy}
              className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
            >
              Zamknij listę
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {canEditDraft ? (
        <form onSubmit={addLine} className="mt-8 space-y-4 border-t border-zinc-200 pt-6">
          <h2 className="text-lg font-medium text-zinc-900">Dodaj pozycję</h2>
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Szukaj w katalogu
            </label>
            <input
              type="search"
              value={itemQuery}
              onChange={(e) => searchItems(e.target.value)}
              placeholder="Nazwa, SKU lub kod"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
            {itemHits.length > 0 ? (
              <ul className="mt-2 divide-y divide-zinc-100 rounded border border-zinc-200">
                {itemHits.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPickedItem(hit);
                        setItemQuery(hit.name);
                        setItemHits([]);
                      }}
                      className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    >
                      <span>
                        <span className="font-medium text-zinc-900">
                          {hit.name}
                        </span>
                        <span className="block text-zinc-500">
                          {hit.sku} · {hit.unit}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {pickedItem ? (
              <p className="mt-2 text-sm text-zinc-700">
                Wybrano: <strong>{pickedItem.name}</strong> ({pickedItem.sku})
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="sm:w-32">
              <label className="block text-sm font-medium text-zinc-700">
                Ilość
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700">
                Notatka (opcjonalnie)
              </label>
              <input
                type="text"
                value={lineNote}
                onChange={(e) => setLineNote(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy || !pickedItem}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Dodaj do listy
          </button>
        </form>
      ) : null}

      <section className="mt-8">
        <h2 className="text-lg font-medium text-zinc-900">
          Pozycje ({list.lines.length})
        </h2>
        {list.lines.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Brak pozycji.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 border-t border-zinc-200">
            {list.lines.map((line) => {
              const checked = Boolean(line.checkedAt);
              return (
                <li
                  key={line.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {canCheck ? (
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busy}
                        onChange={() => toggleChecked(line)}
                        className="mt-1 h-4 w-4"
                        aria-label={`Oznacz ${line.catalogItem.name}`}
                      />
                    ) : checked ? (
                      <span className="mt-0.5 text-sm text-emerald-700">✓</span>
                    ) : null}
                    <div className="min-w-0">
                      <p
                        className={`font-medium text-zinc-900 ${checked ? "line-through opacity-70" : ""}`}
                      >
                        {line.catalogItem.name}
                      </p>
                      <p className="text-sm text-zinc-600">
                        {line.qty} {line.catalogItem.unit} · {line.catalogItem.sku}
                        {line.note ? ` · ${line.note}` : ""}
                      </p>
                    </div>
                  </div>
                  {canEditDraft ? (
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={busy}
                      className="text-sm text-zinc-500 underline hover:text-zinc-800 disabled:opacity-60"
                    >
                      Usuń
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
