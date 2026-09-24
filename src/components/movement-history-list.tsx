"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

const TYPE_LABEL_PL: Record<string, string> = {
  opening: "Otwarcie",
  receipt: "Przyjęcie",
  issue: "Wydanie",
  transfer: "Przesunięcie",
  correction: "Korekta",
};

type MovementRow = {
  id: string;
  type: string;
  qty: string;
  createdAt: string;
  correctsMovementId: string | null;
  hasCorrection: boolean;
  catalogItem: { id: string; sku: string; name: string };
  location: { id: string; code: string; label: string };
  createdBy: { id: string; email: string; name: string | null } | null;
};

type CatalogOption = { id: string; sku: string; name: string };
type LocationOption = { id: string; code: string; label: string };
type ActorOption = { id: string; email: string; name: string | null };

type Props = {
  /** When true, show date/item/location/actor filters (admin audit). */
  showFilters?: boolean;
  /** Hall product history: always filter to this catalog item (F014). */
  initialCatalogItemId?: string;
  /** Optional label shown when viewing one product’s movements. */
  productLabel?: string;
};

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function MovementHistoryList({
  showFilters = false,
  initialCatalogItemId,
  productLabel,
}: Props) {
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [correctingId, setCorrectingId] = useState<string | null>(null);
  const [correctMessage, setCorrectMessage] = useState<string | null>(null);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [catalogItemId, setCatalogItemId] = useState(
    initialCatalogItemId ?? "",
  );
  const [locationId, setLocationId] = useState("");
  const [createdById, setCreatedById] = useState("");

  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([]);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [actorOptions, setActorOptions] = useState<ActorOption[]>([]);

  const productScoped = Boolean(initialCatalogItemId) && !showFilters;

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const params = new URLSearchParams();
      params.set("take", showFilters ? "100" : "40");
      if (productScoped && initialCatalogItemId) {
        params.set("catalogItemId", initialCatalogItemId);
      } else if (showFilters) {
        if (from) {
          params.set("from", new Date(`${from}T00:00:00`).toISOString());
        }
        if (to) {
          params.set("to", new Date(`${to}T23:59:59.999`).toISOString());
        }
        if (catalogItemId) params.set("catalogItemId", catalogItemId);
        if (locationId) params.set("locationId", locationId);
        if (createdById) params.set("createdById", createdById);
      }
      const res = await fetch(`/api/movements?${params.toString()}`);
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
  }, [
    showFilters,
    productScoped,
    initialCatalogItemId,
    from,
    to,
    catalogItemId,
    locationId,
    createdById,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showFilters) return;
    let cancelled = false;
    (async () => {
      const [catalogRes, locRes, usersRes] = await Promise.all([
        fetch("/api/catalog"),
        fetch("/api/locations"),
        fetch("/api/users"),
      ]);
      if (cancelled) return;
      if (catalogRes.ok) {
        const data = (await catalogRes.json()) as {
          items?: CatalogOption[];
        };
        setCatalogOptions(data.items ?? []);
      }
      if (locRes.ok) {
        const data = (await locRes.json()) as { locations: LocationOption[] };
        setLocationOptions(data.locations);
      }
      if (usersRes.ok) {
        const data = (await usersRes.json()) as { users: ActorOption[] };
        setActorOptions(data.users);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showFilters]);

  async function onCorrect(movementId: string) {
    setCorrectingId(movementId);
    setError(null);
    setCorrectMessage(null);
    try {
      const res = await fetch("/api/movements/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movementId }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się zapisać korekty");
        return;
      }
      setCorrectMessage("Zapisano korektę (storno) — pierwotny ruch pozostaje w historii.");
      load();
    } finally {
      setCorrectingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {showFilters
              ? "Audyt ruchów"
              : productScoped
                ? "Historia pozycji"
                : "Historia ruchów"}
          </h1>
          <p className="mt-1 text-zinc-600">
            {showFilters
              ? "Filtruj po dacie, pozycji, lokalizacji i wykonawcy."
              : productScoped
                ? productLabel
                  ? `Ruchy dla ${productLabel} — typ, ilość, lokalizacja, wykonawca, czas.`
                  : "Ruchy tej pozycji — typ, ilość, lokalizacja, wykonawca, czas."
                : "Ostatnie ruchy z aktorem i czasem."}
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

      {showFilters ? (
        <form
          className="mt-6 grid gap-3 sm:grid-cols-2"
          data-testid="movement-filters"
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Od</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Do</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-zinc-700">
              Pozycja katalogu
            </span>
            <select
              value={catalogItemId}
              onChange={(e) => setCatalogItemId(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              data-testid="filter-catalog"
            >
              <option value="">Wszystkie</option>
              {catalogOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">
              Lokalizacja
            </span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              data-testid="filter-location"
            >
              <option value="">Wszystkie</option>
              {locationOptions.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label} ({loc.code})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">
              Wykonawca
            </span>
            <select
              value={createdById}
              onChange={(e) => setCreatedById(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
              data-testid="filter-actor"
            >
              <option value="">Wszyscy</option>
              {actorOptions.map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {actor.name?.trim() || actor.email}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              disabled={pending}
            >
              Filtruj
            </button>
            <button
              type="button"
              className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
              onClick={() => {
                setFrom("");
                setTo("");
                setCatalogItemId("");
                setLocationId("");
                setCreatedById("");
              }}
            >
              Wyczyść
            </button>
            <button
              type="button"
              className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
              onClick={() => {
                const today = toDateInputValue(new Date());
                setFrom(today);
                setTo(today);
              }}
            >
              Dziś
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {correctMessage ? (
        <p className="mt-4 text-sm text-emerald-800" role="status">
          {correctMessage}
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
          const canCorrect =
            row.type !== "correction" &&
            !row.correctsMovementId &&
            !row.hasCorrection;
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
                {row.correctsMovementId
                  ? ` · storno ruchu ${row.correctsMovementId.slice(0, 8)}…`
                  : null}
                {row.hasCorrection ? " · skorygowany" : null}
              </p>
              {canCorrect ? (
                <div className="mt-2">
                  <button
                    type="button"
                    data-testid="correct-movement"
                    className="rounded border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                    disabled={correctingId === row.id || pending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Zapisać korektę (storno) tego ruchu? Pierwotny wpis zostanie w historii.",
                        )
                      ) {
                        return;
                      }
                      void onCorrect(row.id);
                    }}
                  >
                    {correctingId === row.id
                      ? "Zapisywanie…"
                      : "Popraw ten ruch"}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
