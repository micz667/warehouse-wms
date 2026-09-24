"use client";

import { useEffect, useState } from "react";
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

/**
 * Hall Przenieś: shelf → shelf via scan. Posts paired transfer movements (F007).
 */
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
  const [available, setAvailable] = useState<string | null>(null);
  const [stockTick, setStockTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!item || !from) {
      setAvailable(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/stock/item/${encodeURIComponent(item.id)}`);
      if (!res.ok || cancelled) return;
      const body = (await res.json().catch(() => null)) as {
        locations?: { locationId: string; qty: string }[];
      } | null;
      if (cancelled || !body?.locations) return;
      const row = body.locations.find((l) => l.locationId === from.id);
      setAvailable(row?.qty ?? "0");
    })();
    return () => {
      cancelled = true;
    };
  }, [item, from, stockTick]);

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
        setError(body?.error ?? "Nie udało się przenieść towaru");
        return;
      }
      setOk(`Przeniesiono ${qty}: ${from.code} → ${to.code} (${item.name})`);
      setQty("");
      setStockTick((n) => n + 1);
    } finally {
      setPending(false);
    }
  }

  const missing: string[] = [];
  if (!from) missing.push("półkę źródłową");
  if (!item) missing.push("pozycję");
  if (!to) missing.push("półkę docelową");
  if (!qty.trim()) missing.push("ilość");

  return (
    <form
      className="mx-auto w-full max-w-lg space-y-6 px-6 py-8"
      onSubmit={submit}
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Przenieś
        </h1>
        <p className="mt-1 text-zinc-600">
          {fromHub && (initialItem || initialFrom || initialTo)
            ? `Dokończ przeniesienie — brakuje: ${missing.join(", ") || "potwierdzenia"}.`
            : "Z półki na półkę: źródło → pozycja → cel → ilość."}
        </p>
      </div>

      {!canWrite ? (
        <p className="text-sm text-amber-800" role="status">
          Podgląd — tylko magazynier i administrator mogą przenosić towar.
        </p>
      ) : null}

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
          label="Półka źródłowa"
          selected={from}
          onSelect={(loc) => {
            setFrom(loc);
            setOk(null);
          }}
        />
      )}

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

      {item && from && available !== null ? (
        <p
          className="text-sm text-zinc-600"
          data-testid="transfer-available"
          role="status"
        >
          Na źródle:{" "}
          <strong className="tabular-nums text-zinc-900">
            {available} {item.unit}
          </strong>
        </p>
      ) : null}

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
          label="Półka docelowa"
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
        {pending ? "Przenoszenie…" : "Przenieś"}
      </button>
    </form>
  );
}
