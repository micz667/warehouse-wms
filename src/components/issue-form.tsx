"use client";

import { useState } from "react";
import {
  ItemScanField,
  type ScannedCatalogItem,
} from "@/components/item-scan-field";
import { LocationField } from "@/components/location-field";
import type { PickedLocation } from "@/components/location-picker";

type Props = {
  canWrite: boolean;
};

export function IssueForm({ canWrite }: Props) {
  const [item, setItem] = useState<ScannedCatalogItem | null>(null);
  const [location, setLocation] = useState<PickedLocation | null>(null);
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite || !item || !location) return;
    setPending(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/movements/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: item.id,
          locationId: location.id,
          qty,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        movement?: { id: string; qty: string };
      } | null;
      if (!res.ok || !body?.movement) {
        setError(body?.error ?? "Nie udało się zapisać wydania");
        return;
      }
      setOk(
        `Wydano ${body.movement.qty.replace("-", "")} z ${location.code} (${item.name})`,
      );
      setQty("");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mx-auto w-full max-w-lg space-y-6 px-6 py-8" onSubmit={submit}>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Wydanie
        </h1>
        <p className="mt-1 text-zinc-600">
          Pozycja + ilość + lokalizacja źródłowa — odmawia, gdy stan spadłby
          poniżej zera.
        </p>
      </div>

      {!canWrite ? (
        <p className="text-sm text-amber-800" role="status">
          Podgląd — tylko magazynier i administrator mogą wydawać towar.
        </p>
      ) : null}

      <ItemScanField
        selected={item}
        onSelect={(next) => {
          setItem(next);
          setOk(null);
        }}
      />
      <LocationField
        label="Lokalizacja źródłowa"
        selected={location}
        onSelect={(loc) => {
          setLocation(loc);
          setOk(null);
        }}
      />
      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-800">Ilość</span>
        <input
          type="text"
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          disabled={!canWrite}
          required
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
        disabled={!canWrite || pending || !item || !location}
        className="w-full rounded bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Zapisywanie…" : "Zapisz wydanie"}
      </button>
    </form>
  );
}
