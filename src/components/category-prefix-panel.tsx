"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

type Row = {
  id: string;
  category: string;
  prefix: string;
  nextNumber: number;
  itemCount: number;
  prefixEditable: boolean;
};

export function CategoryPrefixPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/category-prefixes");
      const body = (await res.json().catch(() => null)) as {
        rows?: Row[];
        error?: string;
      } | null;
      if (!res.ok || !body?.rows) {
        setError(body?.error ?? "Nie udało się wczytać prefiksów");
        return;
      }
      setRows(body.rows);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePrefix(id: string) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/category-prefixes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: draft }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się zapisać");
        return;
      }
      setMessage("Prefiks zapisany");
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Prefiksy kategorii
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
        Kod pozycji to prefiks + numer (np. KRZ-0042) — jednocześnie SKU i
        Code128 na etykiecie. Zmiana kategorii pozycji nie zmienia już
        przydzielonego kodu. Prefiks można edytować tylko gdy żadna pozycja
        go jeszcze nie używa.
      </p>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-8 overflow-x-auto">
        <table
          className="w-full min-w-[40rem] border-collapse text-left text-sm"
          data-testid="category-prefix-table"
        >
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-3 font-medium">Kategoria</th>
              <th className="py-2 pr-3 font-medium">Prefiks</th>
              <th className="py-2 pr-3 font-medium">Następny nr</th>
              <th className="py-2 pr-3 font-medium">Pozycje</th>
              <th className="py-2 font-medium">Akcja</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-zinc-100"
                data-testid={`prefix-row-${row.prefix}`}
              >
                <td className="py-2 pr-3 text-zinc-800">{row.category}</td>
                <td className="py-2 pr-3 font-mono text-zinc-900">
                  {editingId === row.id ? (
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.toUpperCase())}
                      maxLength={4}
                      className="w-20 rounded border border-zinc-300 px-2 py-1 font-mono uppercase"
                      data-testid="prefix-edit-input"
                    />
                  ) : (
                    row.prefix
                  )}
                </td>
                <td className="py-2 pr-3 font-mono text-zinc-700">
                  {String(row.nextNumber).padStart(4, "0")}
                </td>
                <td className="py-2 pr-3 text-zinc-700">{row.itemCount}</td>
                <td className="py-2">
                  {editingId === row.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void savePrefix(row.id)}
                        className="rounded bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-50"
                      >
                        Zapisz
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setEditingId(null)}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs"
                      >
                        Anuluj
                      </button>
                    </div>
                  ) : row.prefixEditable ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(row.id);
                        setDraft(row.prefix);
                        setMessage(null);
                      }}
                      className="text-xs text-zinc-700 underline"
                      data-testid={`prefix-edit-${row.prefix}`}
                    >
                      Edytuj
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400">zajęty</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
