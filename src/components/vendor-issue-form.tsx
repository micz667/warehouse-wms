"use client";

import { useState } from "react";
import {
  ItemScanField,
  type ScannedCatalogItem,
} from "@/components/item-scan-field";
import type { PickedLocation } from "@/components/location-picker";
import { RenovationLocationField } from "@/components/renovation-location-field";

type DraftLine = {
  key: string;
  item: ScannedCatalogItem;
  location: PickedLocation;
  qty: string;
};

type Props = {
  canWrite: boolean;
};

/**
 * Batch vendor issue from renovation section (F016).
 * Each line posts an issue movement with actor and time.
 */
export function VendorIssueForm({ canWrite }: Props) {
  const [item, setItem] = useState<ScannedCatalogItem | null>(null);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [qty, setQty] = useState("");
  const [available, setAvailable] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function refreshAvailable(
    nextItem: ScannedCatalogItem | null,
    nextLoc: PickedLocation | null,
  ) {
    if (!nextItem || !nextLoc) {
      setAvailable(null);
      return;
    }
    const res = await fetch(
      `/api/stock/item/${encodeURIComponent(nextItem.id)}`,
    );
    if (!res.ok) {
      setAvailable(null);
      return;
    }
    const body = (await res.json().catch(() => null)) as {
      locations?: { locationId: string; qty: string }[];
    } | null;
    const row = body?.locations?.find((l) => l.locationId === nextLoc.id);
    setAvailable(row?.qty ?? "0");
  }

  function addLine() {
    setError(null);
    setOk(null);
    if (!item || !location) {
      setError("Zeskanuj pozycję i lokalizację renowacji");
      return;
    }
    if (!qty.trim()) {
      setError("Podaj ilość");
      return;
    }
    const key = `${item.id}:${location.id}`;
    if (lines.some((l) => l.key === key)) {
      setError(
        "Ta pozycja z tej lokalizacji jest już na liście — usuń ją i dodaj ponownie",
      );
      return;
    }
    setLines((prev) => [
      ...prev,
      { key, item, location, qty: qty.trim() },
    ]);
    setQty("");
    setItem(null);
    setAvailable(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite || lines.length === 0) return;
    setPending(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/movements/vendor-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            catalogItemId: l.item.id,
            locationId: l.location.id,
            qty: l.qty,
          })),
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        movements?: { id: string; qty: string; createdAt: string }[];
      } | null;
      if (!res.ok || !body?.movements) {
        setError(body?.error ?? "Nie udało się wydać do dostawcy");
        return;
      }
      setOk(
        `Wydano do dostawcy ${body.movements.length} pozycj${body.movements.length === 1 ? "ę" : "e"} z renowacji.`,
      );
      setLines([]);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-lg space-y-6 px-6 py-8"
      onSubmit={submit}
      data-testid="vendor-issue-form"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Wydanie do dostawcy
        </h1>
        <p className="mt-1 text-zinc-600">
          Partia z sekcji renowacji — stan zejdzie od razu, z aktorem i czasem.
        </p>
      </div>

      {!canWrite ? (
        <p className="text-sm text-amber-800" role="status">
          Podgląd — tylko magazynier i administrator mogą wydawać do dostawcy.
        </p>
      ) : null}

      <ItemScanField
        selected={item}
        onSelect={(next) => {
          setItem(next);
          setOk(null);
          void refreshAvailable(next, location);
        }}
      />

      <RenovationLocationField
        label="Lokalizacja renowacji"
        selected={location}
        onSelect={(loc) => {
          setLocation(loc);
          setOk(null);
          void refreshAvailable(item, loc);
        }}
      />

      {available !== null ? (
        <p className="text-sm text-zinc-600" data-testid="vendor-issue-available">
          Dostępne w renowacji: <strong>{available}</strong>
        </p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-800">Ilość</span>
        <input
          type="text"
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          disabled={!canWrite}
          data-testid="vendor-issue-qty"
        />
      </label>

      <button
        type="button"
        disabled={!canWrite || !item || !location}
        onClick={addLine}
        className="w-full rounded border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
        data-testid="vendor-issue-add-line"
      >
        Dodaj do partii
      </button>

      {lines.length > 0 ? (
        <ul
          className="divide-y divide-zinc-200 border border-zinc-200"
          data-testid="vendor-issue-lines"
        >
          {lines.map((line) => (
            <li
              key={line.key}
              className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-zinc-900">{line.item.name}</p>
                <p className="text-zinc-600">
                  {line.qty} · {line.location.code}
                </p>
              </div>
              <button
                type="button"
                className="text-xs underline"
                onClick={() =>
                  setLines((prev) => prev.filter((l) => l.key !== line.key))
                }
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      ) : null}

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
        disabled={!canWrite || pending || lines.length === 0}
        className="w-full rounded bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        data-testid="vendor-issue-submit"
      >
        {pending ? "Wydawanie…" : "Wydaj partię do dostawcy"}
      </button>
    </form>
  );
}
