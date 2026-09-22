"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export type CatalogListItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  barcode: string;
  photoPath: string | null;
};

type Props = {
  canWrite: boolean;
};

export function CatalogSearchList({ canWrite }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback((q: string) => {
    startTransition(async () => {
      setError(null);
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/catalog${params}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Nie udało się wczytać katalogu");
        return;
      }
      const data = (await res.json()) as { items: CatalogListItem[] };
      setItems(data.items);
    });
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Katalog
          </h1>
          <p className="mt-1 text-zinc-600">
            Pozycje SKU z kodem kreskowym Code128.
          </p>
        </div>
        {canWrite ? (
          <Link
            href="/katalog/nowy"
            className="inline-flex items-center justify-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Nowa pozycja
          </Link>
        ) : null}
      </div>

      <form
        className="mt-8 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load(query);
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Szukaj: nazwa, SKU, kod, kategoria…"
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          aria-label="Szukaj w katalogu"
        />
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
          disabled={pending}
        >
          Szukaj
        </button>
      </form>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-zinc-200 border-t border-zinc-200">
        {items.length === 0 && !pending ? (
          <li className="py-8 text-center text-sm text-zinc-500">
            Brak pozycji{query.trim() ? " dla tego wyszukiwania" : ""}.
          </li>
        ) : null}
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="flex w-full items-start gap-4 py-4 text-left hover:bg-zinc-100/80"
              onClick={() => router.push(`/katalog/${item.id}`)}
            >
              {item.photoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photoPath}
                  alt=""
                  className="h-14 w-14 shrink-0 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-zinc-200 text-xs text-zinc-500">
                  brak
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900">{item.name}</p>
                <p className="mt-0.5 text-sm text-zinc-600">
                  {item.sku} · {item.category} · {item.unit}
                </p>
                <p className="mt-0.5 font-mono text-xs text-zinc-500">
                  {item.barcode}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
