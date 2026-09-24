"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

export type LocationListItem = {
  id: string;
  code: string;
  label: string;
  isRenovation?: boolean;
};

type Props = {
  canWrite: boolean;
};

export function LocationSearchList({ canWrite }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState<LocationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback((q: string) => {
    startTransition(async () => {
      setError(null);
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/locations${params}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać lokalizacji");
        return;
      }
      const data = (await res.json()) as { locations: LocationListItem[] };
      setLocations(data.locations);
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
            Lokalizacje
          </h1>
          <p className="mt-1 text-zinc-600">
            Miejsca składowania z kodem do skanu Code128.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/lokalizacje/wybierz"
            className="inline-flex items-center justify-center rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Wybierz (stub)
          </Link>
          {canWrite ? (
            <Link
              href="/lokalizacje/nowa"
              className="inline-flex items-center justify-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Nowa lokalizacja
            </Link>
          ) : null}
        </div>
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
          placeholder="Szukaj: kod lub nazwa…"
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          aria-label="Szukaj lokalizacji"
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
        {locations.length === 0 && !pending ? (
          <li className="py-8 text-center text-sm text-zinc-500">
            Brak lokalizacji{query.trim() ? " dla tego wyszukiwania" : ""}.
          </li>
        ) : null}
        {locations.map((loc) => (
          <li key={loc.id}>
            <button
              type="button"
              className="flex w-full items-start gap-4 py-4 text-left hover:bg-zinc-100/80"
              onClick={() => router.push(`/lokalizacje/${loc.id}`)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900">
                  {loc.label}
                  {loc.isRenovation ? (
                    <span className="ml-2 text-xs font-normal text-zinc-500">
                      renowacja
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 font-mono text-sm text-zinc-600">
                  {loc.code}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
