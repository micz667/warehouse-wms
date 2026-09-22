"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

const TYPE_LABEL_PL: Record<string, string> = {
  opening: "Otwarcie",
  receipt: "Przyjęcie",
  issue: "Wydanie",
  transfer: "Przesunięcie",
};

type MovementRow = {
  id: string;
  type: string;
  qty: string;
  createdAt: string;
  catalogItem: { sku: string; name: string };
  location: { code: string; label: string };
  createdBy: { email: string; name: string | null } | null;
};

export function MovementHistoryList() {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/movements?take=40");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać historii");
        return;
      }
      const data = (await res.json()) as { movements: MovementRow[] };
      setRows(data.movements);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Historia ruchów
          </h1>
          <p className="mt-1 text-zinc-600">
            Ostatnie ruchy z aktorem i czasem — pełny audyt w F009.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
          disabled={pending}
        >
          Odśwież
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-zinc-200 border-t border-zinc-200">
        {rows.length === 0 && !pending ? (
          <li className="py-8 text-center text-sm text-zinc-500">
            Brak ruchów.
          </li>
        ) : null}
        {rows.map((row) => {
          const actor =
            row.createdBy?.name?.trim() ||
            row.createdBy?.email ||
            "—";
          const when = new Date(row.createdAt).toLocaleString("pl-PL");
          return (
            <li key={row.id} className="py-4" data-testid="movement-row">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-zinc-900">
                  {TYPE_LABEL_PL[row.type] ?? row.type}{" "}
                  <span className="font-mono text-zinc-700">{row.qty}</span>
                </p>
                <p className="text-xs text-zinc-500">{when}</p>
              </div>
              <p className="mt-1 text-sm text-zinc-700">
                {row.catalogItem.name}{" "}
                <span className="font-mono text-zinc-500">
                  ({row.catalogItem.sku})
                </span>
                {" · "}
                {row.location.label}{" "}
                <span className="font-mono text-zinc-500">
                  ({row.location.code})
                </span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Wykonał: {actor}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
