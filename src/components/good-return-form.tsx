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
  initialLocation?: PickedLocation | null;
  fromHub?: boolean;
};

/**
 * Good return (F016): scan → qty → shelf → stock back via receipt movement.
 * Distinct from renovation return — destination is a normal shelf.
 */
export function GoodReturnForm({
  canWrite,
  initialItem = null,
  initialLocation = null,
  fromHub = false,
}: Props) {
  const [item, setItem] = useState<ScannedCatalogItem | null>(initialItem);
  const [location, setLocation] = useState<PickedLocation | null>(
    initialLocation,
  );
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
      const res = await fetch("/api/movements/return", {
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
        setError(body?.error ?? "Nie udało się zapisać zwrotu");
        return;
      }
      setOk(
        `Zwrot ${body.movement.qty} → półka ${location.code} (${item.name})`,
      );
      setQty("");
    } finally {
      setPending(false);
    }
  }

  const missing: string[] = [];
  if (!item) missing.push("pozycję");
  if (!location) missing.push("półkę");
  if (!qty.trim()) missing.push("ilość");

  const showPrefillItem = Boolean(initialItem && fromHub && item);

  return (
    <form
      className="mx-auto w-full max-w-lg space-y-6 px-6 py-8"
      onSubmit={submit}
      data-testid="good-return-form"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Zwrot
        </h1>
        <p className="mt-1 text-zinc-600">
          {fromHub && (initialItem || initialLocation)
            ? `Dokończ zwrot na półkę — brakuje: ${missing.join(", ") || "potwierdzenia"}.`
            : "Dobry zwrot: skan → ilość → półka — stan wraca na regał."}
        </p>
      </div>

      {!canWrite ? (
        <p className="text-sm text-amber-800" role="status">
          Podgląd — tylko magazynier i administrator mogą przyjmować zwroty.
        </p>
      ) : null}

      {showPrefillItem && item ? (
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

      {initialLocation && fromHub && location ? (
        <div
          className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          data-testid="picked-location"
          data-location-id={location.id}
        >
          <strong>{location.label}</strong>{" "}
          <span className="font-mono">({location.code})</span>
        </div>
      ) : (
        <LocationField
          label="Półka docelowa"
          selected={location}
          onSelect={(loc) => {
            setLocation(loc);
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
          data-testid="good-return-qty"
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
        data-testid="good-return-submit"
      >
        {pending ? "Zapisywanie…" : "Zapisz zwrot na półkę"}
      </button>
    </form>
  );
}
