"use client";

import { useState } from "react";
import type { PickedLocation } from "@/components/location-picker";
import { BarcodeScanner } from "@/components/barcode-scanner";

export type RenovationLocation = PickedLocation & { isRenovation: true };

type Props = {
  label: string;
  selected: PickedLocation | null;
  onSelect: (location: PickedLocation | null) => void;
};

/**
 * Location resolve restricted to renovation-section locations (F016).
 * Scan/code resolve still hits by-code; non-renovation codes are refused.
 */
export function RenovationLocationField({
  label,
  selected,
  onSelect,
}: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, setPending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [options, setOptions] = useState<PickedLocation[]>([]);

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
      const data = (await res.json()) as {
        location: PickedLocation & { isRenovation?: boolean };
      };
      if (!data.location.isRenovation) {
        setError("To nie jest lokalizacja sekcji renowacji");
        return;
      }
      onSelect(data.location);
      setCode("");
      setCameraOn(false);
    } finally {
      setPending(false);
    }
  }

  async function openPicker() {
    setPickerOpen(true);
    setError(null);
    const res = await fetch("/api/locations?renovation=1");
    if (!res.ok) {
      setError("Nie udało się wczytać lokalizacji renowacji");
      return;
    }
    const data = (await res.json()) as { locations: PickedLocation[] };
    setOptions(data.locations);
  }

  return (
    <fieldset className="space-y-3" data-testid="renovation-location-field">
      <legend className="text-sm font-medium text-zinc-800">{label}</legend>
      {selected ? (
        <div
          className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          data-testid="picked-location"
          data-location-id={selected.id}
          data-renovation="1"
        >
          <strong>{selected.label}</strong>{" "}
          <span className="font-mono">({selected.code})</span>
          <span className="ml-2 text-xs text-emerald-800">renowacja</span>
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
              onClick={() => setCameraOn((v) => !v)}
            >
              {cameraOn ? "Wyłącz kamerę" : "Skanuj lokalizację"}
            </button>
            <button
              type="button"
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
              onClick={() => void openPicker()}
              data-testid="renovation-location-list"
            >
              Lista renowacji
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
              placeholder="Kod lokalizacji renowacji…"
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
          {pickerOpen ? (
            <ul
              className="max-h-48 divide-y divide-zinc-200 overflow-y-auto border border-zinc-200 bg-white"
              data-testid="renovation-location-options"
            >
              {options.length === 0 ? (
                <li className="px-3 py-2 text-sm text-zinc-600">
                  Brak lokalizacji renowacji — administrator musi oznaczyć
                  lokalizację jako sekcję renowacji.
                </li>
              ) : (
                options.map((loc) => (
                  <li key={loc.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
                      onClick={() => {
                        onSelect(loc);
                        setPickerOpen(false);
                      }}
                    >
                      <span className="font-medium">{loc.label}</span>{" "}
                      <span className="font-mono text-zinc-600">
                        ({loc.code})
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
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
