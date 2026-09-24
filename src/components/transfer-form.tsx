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
  initialItem?: ScannedCatalogItem | null;
  initialFrom?: PickedLocation | null;
  initialTo?: PickedLocation | null;
  fromHub?: boolean;
};

export function TransferForm({
  canWrite,
  initialItem = null,
  initialFrom = null,
  initialTo = null,
  fromHub = false,
}: Props) {
  const [item, setItem] = useState<ScannedCatalogItem | null>(initialItem);
  const [from, setFrom] = useState<PickedLocation | null>(initialFrom);
  const [to, setTo] = useState<PickedLocation | null>(initialTo);
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite || !item || !from || !to) return;
    setPending(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/movements/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: item.id,
          fromLocationId: from.id,
          toLocationId: to.id,
          qty,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        from?: { qty: string };
        to?: { qty: string };
      } | null;
      if (!res.ok || !body?.from || !body?.to) {
        setError(body?.error ?? "Nie udało się zapisać przesunięcia");
        return;
      }
      setOk(
        `Przesunięto ${qty}: ${from.code} → ${to.code} (${item.name})`,
      );
      setQty("");
    } finally {
      setPending(false);
    }
  }

  const missing: string[] = [];
  if (!item) missing.push("pozycję");
  if (!from) missing.push("lokalizację źródłową");
  if (!to) missing.push("lokalizację docelową");
  if (!qty.trim()) missing.push("ilość");

  return (
    <form className="mx-auto w-full max-w-lg space-y-6 px-6 py-8" onSubmit={submit}>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Przesunięcie
        </h1>
        <p className="mt-1 text-zinc-600">
          {fromHub && (initialItem || initialFrom || initialTo)
            ? `Dokończ przesunięcie — brakuje: ${missing.join(", ") || "potwierdzenia"}.`
            : "Para ruchów transfer: −źródło i +cel o tej samej ilości."}
        </p>
      </div>

      {!canWrite ? (
        <p className="text-sm text-amber-800" role="status">
          Podgląd — tylko magazynier i administrator mogą przesuwać towar.
        </p>
      ) : null}

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
        </div>
      ) : (
        <ItemScanField
          selected={item}
          onSelect={(next) => {
            setItem(next);
            setOk(null);
          }}
        />
      )}

      {initialFrom && fromHub && from ? (
        <div
          className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          data-testid="picked-location"
          data-location-id={from.id}
        >
          Źródło: <strong>{from.label}</strong>{" "}
          <span className="font-mono">({from.code})</span>
        </div>
      ) : (
        <LocationField
          label="Lokalizacja źródłowa"
          selected={from}
          onSelect={(loc) => {
            setFrom(loc);
            setOk(null);
          }}
        />
      )}

      {initialTo && fromHub && to ? (
        <div
          className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          data-testid="picked-location-to"
          data-location-id={to.id}
        >
          Cel: <strong>{to.label}</strong>{" "}
          <span className="font-mono">({to.code})</span>
        </div>
      ) : (
        <LocationField
          label="Lokalizacja docelowa"
          selected={to}
          onSelect={(loc) => {
            setTo(loc);
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
        disabled={!canWrite || pending || !item || !from || !to}
        className="w-full rounded bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "Zapisywanie…" : "Zapisz przesunięcie"}
      </button>
    </form>
  );
}
