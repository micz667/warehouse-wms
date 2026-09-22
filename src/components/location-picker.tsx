"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

export type PickedLocation = {
  id: string;
  code: string;
  label: string;
};

type Props = {
  /** Called when the user selects from the list or resolves a typed/scanned code. */
  onSelect?: (location: PickedLocation) => void;
  /** Optional initial selection (e.g. demo page). */
  selectedId?: string | null;
};

/**
 * Stub location picker for F007 receipt/transfer/issue.
 * Select from the list or enter a code (camera scan can fill the same field later).
 */
export function LocationPicker({ onSelect, selectedId = null }: Props) {
  const [query, setQuery] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [locations, setLocations] = useState<PickedLocation[]>([]);
  const [selected, setSelected] = useState<PickedLocation | null>(null);
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
      const data = (await res.json()) as { locations: PickedLocation[] };
      setLocations(data.locations);
      if (selectedId) {
        const match = data.locations.find((loc) => loc.id === selectedId);
        if (match) setSelected(match);
      }
    });
  }, [selectedId]);

  useEffect(() => {
    load("");
  }, [load]);

  function pick(location: PickedLocation) {
    setSelected(location);
    setError(null);
    onSelect?.(location);
  }

  async function resolveCode(event: React.FormEvent) {
    event.preventDefault();
    const raw = codeInput.trim();
    if (!raw) return;
    setError(null);
    const res = await fetch(
      `/api/locations/by-code/${encodeURIComponent(raw)}`,
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Nie znaleziono lokalizacji o tym kodzie");
      return;
    }
    const data = (await res.json()) as { location: PickedLocation };
    pick(data.location);
    setCodeInput("");
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Wybierz lokalizację
      </h1>
      <p className="mt-1 text-zinc-600">
        Stub pod ruchy (F007) — wpisz lub zeskanuj kod, albo wybierz z listy.
      </p>

      <form className="mt-8 flex gap-2" onSubmit={resolveCode}>
        <input
          type="text"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="Kod lokalizacji (skan)…"
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
          aria-label="Kod lokalizacji"
          autoComplete="off"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Użyj kodu
        </button>
      </form>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          load(query);
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtruj listę…"
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          aria-label="Filtruj lokalizacje"
        />
        <button
          type="submit"
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
          disabled={pending}
        >
          Filtruj
        </button>
      </form>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {selected ? (
        <div
          className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="status"
          data-testid="picked-location"
          data-location-id={selected.id}
          data-location-code={selected.code}
        >
          Wybrano: <strong>{selected.label}</strong>{" "}
          <span className="font-mono">({selected.code})</span>
        </div>
      ) : null}

      <ul className="mt-6 divide-y divide-zinc-200 border-t border-zinc-200">
        {locations.length === 0 && !pending ? (
          <li className="py-8 text-center text-sm text-zinc-500">
            Brak lokalizacji na liście.
          </li>
        ) : null}
        {locations.map((loc) => {
          const isSelected = selected?.id === loc.id;
          return (
            <li key={loc.id}>
              <button
                type="button"
                className={`flex w-full items-start py-4 text-left hover:bg-zinc-100/80 ${
                  isSelected ? "bg-zinc-100" : ""
                }`}
                onClick={() => pick(loc)}
                aria-pressed={isSelected}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900">
                    {loc.label}
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-zinc-600">
                    {loc.code}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
