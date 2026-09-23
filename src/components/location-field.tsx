"use client";

import { useState } from "react";
import type { PickedLocation } from "@/components/location-picker";
import { BarcodeScanner } from "@/components/barcode-scanner";

type Props = {
  label: string;
  selected: PickedLocation | null;
  onSelect: (location: PickedLocation | null) => void;
};

/** Compact location resolve for movement flows — code + optional camera. */
export function LocationField({ label, selected, onSelect }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, setPending] = useState(false);

  async function resolve(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/locations/by-code/${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie znaleziono lokalizacji");
        return;
      }
      const data = (await res.json()) as { location: PickedLocation };
      onSelect(data.location);
      setCode("");
      setCameraOn(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-zinc-800">{label}</legend>
      {selected ? (
        <div
          className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          data-testid="picked-location"
          data-location-id={selected.id}
        >
          <strong>{selected.label}</strong>{" "}
          <span className="font-mono">({selected.code})</span>
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
              {cameraOn ? "Wyłącz kamerę" : "Skanuj lokalizację"}
            </button>
          </div>
          {cameraOn ? (
            <BarcodeScanner
              active={cameraOn}
              onScan={(value) => {
                void resolve(value);
              }}
            />
          ) : null}
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                void resolve(code);
              }}
              placeholder="Kod lokalizacji…"
              className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
              aria-label={label}
              autoComplete="off"
              disabled={pending}
            />
            <button
              type="button"
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              disabled={pending}
              onClick={() => void resolve(code)}
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
