"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  ItemScanField,
  type ScannedCatalogItem,
} from "@/components/item-scan-field";
import { LocationField } from "@/components/location-field";
import type { PickedLocation } from "@/components/location-picker";
import { CAFE_ISSUE_STATUS_LABEL_PL } from "@/lib/cafe-issue-labels";

type DraftLine = {
  key: string;
  item: ScannedCatalogItem;
  source: PickedLocation;
  qty: string;
};

type PreparedRow = {
  id: string;
  status: keyof typeof CAFE_ISSUE_STATUS_LABEL_PL;
  preparedAt: string;
  cafeLocation: { id: string; code: string; label: string };
  lineCount: number;
  note: string | null;
};

type Props = {
  canWrite: boolean;
  initialItem?: ScannedCatalogItem | null;
  initialSource?: PickedLocation | null;
  fromHub?: boolean;
};

/**
 * Hall Wydaj: build a multi-line cafe package, then prepare (in-transit).
 * Stock stays until F013b signature — this form only POSTs cafe-issues.
 */
export function CafePrepareForm({
  canWrite,
  initialItem = null,
  initialSource = null,
  fromHub = false,
}: Props) {
  const router = useRouter();
  const [cafe, setCafe] = useState<PickedLocation | null>(null);
  const [item, setItem] = useState<ScannedCatalogItem | null>(initialItem);
  const [source, setSource] = useState<PickedLocation | null>(initialSource);
  const [qty, setQty] = useState("");
  const [available, setAvailable] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [prepared, setPrepared] = useState<PreparedRow[]>([]);
  const [, startTransition] = useTransition();

  const loadPrepared = useCallback(() => {
    startTransition(async () => {
      const res = await fetch("/api/cafe-issues");
      if (!res.ok) return;
      const data = (await res.json()) as { cafeIssues: PreparedRow[] };
      setPrepared(data.cafeIssues);
    });
  }, []);

  useEffect(() => {
    loadPrepared();
  }, [loadPrepared]);

  useEffect(() => {
    if (!item || !source) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/stock/item/${encodeURIComponent(item.id)}`);
      if (!res.ok || cancelled) return;
      const body = (await res.json().catch(() => null)) as {
        locations?: { locationId: string; qty: string }[];
      } | null;
      if (cancelled || !body?.locations) return;
      const row = body.locations.find((l) => l.locationId === source.id);
      setAvailable(row?.qty ?? "0");
    })();
    return () => {
      cancelled = true;
    };
  }, [item, source]);

  function addLine() {
    setError(null);
    setOk(null);
    if (!item || !source) {
      setError("Zeskanuj pozycję i lokalizację źródłową");
      return;
    }
    if (!qty.trim()) {
      setError("Podaj ilość");
      return;
    }
    if (cafe && source.id === cafe.id) {
      setError("Źródło nie może być tą samą lokalizacją co kawiarnia");
      return;
    }
    const key = `${item.id}:${source.id}`;
    const existing = lines.find((l) => l.key === key);
    if (existing) {
      setError(
        "Ta pozycja z tej półki jest już na liście — usuń ją i dodaj ponownie z łączną ilością",
      );
      return;
    }
    setLines((prev) => [
      ...prev,
      { key, item, source, qty: qty.trim() },
    ]);
    setQty("");
    setItem(null);
    setSource(null);
    setAvailable(null);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
    setOk(null);
  }

  async function preparePackage(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setPending(true);
    setError(null);
    setOk(null);
    try {
      if (!cafe) {
        setError("Wybierz kawiarnię docelową");
        return;
      }
      if (lines.length === 0) {
        setError("Dodaj co najmniej jedną pozycję do paczki");
        return;
      }
      const res = await fetch("/api/cafe-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafeLocationId: cafe.id,
          note: note.trim() || null,
          lines: lines.map((l) => ({
            catalogItemId: l.item.id,
            sourceLocationId: l.source.id,
            qty: l.qty,
          })),
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        cafeIssue?: { id: string };
      } | null;
      if (!res.ok || !body?.cafeIssue) {
        setError(body?.error ?? "Nie udało się przygotować paczki");
        return;
      }
      setOk("Paczka przygotowana — otwórz ją na miejscu i zbierz podpis odbioru.");
      setLines([]);
      setNote("");
      loadPrepared();
      router.push(`/ruchy/wydanie/${body.cafeIssue.id}`);
    } finally {
      setPending(false);
    }
  }

  const missing: string[] = [];
  if (!cafe) missing.push("kawiarnię");
  if (lines.length === 0) missing.push("pozycje");

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 px-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Wydaj do kawiarni
        </h1>
        <p className="mt-1 text-zinc-600">
          {fromHub && (initialItem || initialSource)
            ? `Buduj paczkę — brakuje: ${missing.join(", ") || "potwierdzenia"}.`
            : "Skan / katalog → ilości → kawiarnia. Przygotowanie nie zmienia stanów — podpis na miejscu odejmie stan."}
        </p>
      </div>

      {!canWrite ? (
        <p className="text-sm text-amber-800" role="status">
          Podgląd — tylko magazynier i administrator mogą przygotować wydanie.
        </p>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={preparePackage}
        data-testid="cafe-prepare-form"
      >
        <LocationField
          label="Kawiarnia (cel)"
          selected={cafe}
          onSelect={(loc) => {
            setCafe(loc);
            setOk(null);
          }}
        />

        <fieldset className="space-y-4 border-t border-zinc-200 pt-4">
          <legend className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Pozycje paczki
          </legend>

          {initialItem && fromHub && item ? (
            <div
              className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              data-testid="picked-item"
              data-item-id={item.id}
            >
              <strong>{item.name}</strong>{" "}
              <span className="font-mono text-zinc-700">
                ({item.sku} · {item.barcode})
              </span>
              <button
                type="button"
                className="ml-2 text-xs underline"
                onClick={() => {
                  setItem(null);
                  setAvailable(null);
                }}
              >
                Zmień
              </button>
            </div>
          ) : (
            <ItemScanField
              selected={item}
              onSelect={(next) => {
                setItem(next);
                setAvailable(null);
                setOk(null);
              }}
            />
          )}

          {initialSource && fromHub && source ? (
            <div
              className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              data-testid="picked-location"
              data-location-id={source.id}
            >
              <strong>{source.label}</strong>{" "}
              <span className="font-mono">({source.code})</span>
              <button
                type="button"
                className="ml-2 text-xs underline"
                onClick={() => {
                  setSource(null);
                  setAvailable(null);
                }}
              >
                Zmień
              </button>
            </div>
          ) : (
            <LocationField
              label="Lokalizacja źródłowa"
              selected={source}
              onSelect={(loc) => {
                setSource(loc);
                setAvailable(null);
                setOk(null);
              }}
            />
          )}

          <label className="block space-y-1">
            <span className="text-sm font-medium text-zinc-800">Ilość</span>
            <input
              type="text"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
              disabled={!canWrite}
              data-testid="cafe-prepare-qty"
            />
            {available != null ? (
              <span
                className="text-xs text-zinc-600"
                data-testid="cafe-prepare-available"
              >
                Dostępne na źródle: {available}
              </span>
            ) : null}
          </label>

          <button
            type="button"
            disabled={!canWrite || !item || !source || !qty.trim()}
            onClick={addLine}
            className="w-full rounded border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
            data-testid="cafe-prepare-add-line"
          >
            Dodaj do paczki
          </button>
        </fieldset>

        {lines.length > 0 ? (
          <ul
            className="divide-y divide-zinc-200 border border-zinc-200"
            data-testid="cafe-prepare-lines"
          >
            {lines.map((line) => (
              <li
                key={line.key}
                className="flex items-start justify-between gap-3 px-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">{line.item.name}</p>
                  <p className="font-mono text-xs text-zinc-600">
                    {line.item.sku} · ze {line.source.code} · {line.qty}{" "}
                    {line.item.unit}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-700 underline"
                  onClick={() => removeLine(line.key)}
                  disabled={!canWrite}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-800">
            Notatka (opcjonalnie)
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
            disabled={!canWrite}
          />
        </label>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm text-emerald-800" role="status">
            {ok}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canWrite || pending || !cafe || lines.length === 0}
          className="w-full rounded bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          data-testid="cafe-prepare-submit"
        >
          {pending ? "Przygotowywanie…" : "Przygotuj paczkę"}
        </button>
        <p className="text-xs text-zinc-500">
          Przygotowanie nie odejmuje stanu. Otwórz paczkę na liście i zbierz
          podpis odbioru, żeby zejść ze stanu.
        </p>
      </form>

      <section aria-label="Przygotowane wydania" className="border-t border-zinc-200 pt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Przygotowane / w drodze
        </h2>
        {prepared.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Brak przygotowanych paczek.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200" data-testid="cafe-prepared-list">
            {prepared.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/ruchy/wydanie/${row.id}`}
                  className="block py-3 hover:bg-zinc-50"
                  data-testid={`cafe-prepared-${row.id}`}
                >
                  <p className="font-medium text-zinc-900">
                    {row.cafeLocation.label}{" "}
                    <span className="font-mono text-sm text-zinc-600">
                      ({row.cafeLocation.code})
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    {CAFE_ISSUE_STATUS_LABEL_PL[row.status]} · {row.lineCount}{" "}
                    poz. ·{" "}
                    {new Date(row.preparedAt).toLocaleString("pl-PL")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
