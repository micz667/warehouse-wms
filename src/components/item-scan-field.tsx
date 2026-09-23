"use client";

import { useState } from "react";
import { BarcodeScanner } from "@/components/barcode-scanner";

export type ScannedCatalogItem = {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  unit: string;
};

type Props = {
  onSelect: (item: ScannedCatalogItem | null) => void;
  selected: ScannedCatalogItem | null;
};

/** Item resolve: camera scan or typed barcode fallback. */
export function ItemScanField({ onSelect, selected }: Props) {
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, setPending] = useState(false);

  async function resolveBarcode(raw: string) {
    const code = raw.trim();
    if (!code) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/catalog/by-barcode/${encodeURIComponent(code)}`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie znaleziono pozycji");
        return;
      }
      const data = (await res.json()) as { item: ScannedCatalogItem };
      onSelect(data.item);
      setManual("");
      setCameraOn(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-zinc-800">Pozycja</legend>
      {selected ? (
        <div
          className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          data-testid="picked-item"
          data-item-id={selected.id}
        >
          <strong>{selected.name}</strong>{" "}
          <span className="font-mono text-zinc-700">
            ({selected.sku} · {selected.barcode})
          </span>
          <button
            type="button"
            className="ml-3 text-xs underline"
            onClick={() => onSelect(null)}
          >
            Zmień
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
              onClick={() => setCameraOn((v) => !v)}
            >
              {cameraOn ? "Wyłącz kamerę" : "Skanuj kamerą"}
            </button>
          </div>
          {cameraOn ? (
            <BarcodeScanner
              active={cameraOn}
              onScan={(value) => {
                void resolveBarcode(value);
              }}
            />
          ) : null}
          <div className="flex gap-2">
            <input
              type="text"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                void resolveBarcode(manual);
              }}
              placeholder="Kod kreskowy (wpisz)…"
              className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
              aria-label="Kod kreskowy pozycji"
              autoComplete="off"
              disabled={pending}
            />
            <button
              type="button"
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              disabled={pending}
              onClick={() => void resolveBarcode(manual)}
            >
              Użyj
            </button>
          </div>
        </>
      )}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
