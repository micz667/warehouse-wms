"use client";

import Link from "next/link";
import { useState } from "react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import type { ScannedCatalogItem } from "@/components/item-scan-field";
import type { PickedLocation } from "@/components/location-picker";
import {
  hubGestureHref,
  missingFieldsAfterHubScan,
  type HubGesture,
} from "@/lib/hub-gesture-fields";

type ResolvedScan =
  | { kind: "item"; item: ScannedCatalogItem }
  | { kind: "location"; location: PickedLocation };

const PROCESS_TILES = [
  {
    href: "/ruchy/przyjecie",
    title: "Przyjmij",
    blurb: "Towar na lokalizację.",
  },
  {
    href: "/ruchy/wydanie",
    title: "Wydaj",
    blurb: "Towar z lokalizacji.",
  },
  {
    href: "/ruchy/przesuniecie",
    title: "Przenieś",
    blurb: "Z lokalizacji na lokalizację.",
  },
  {
    href: "/ruchy/historia",
    title: "Historia",
    blurb: "Ostatnie ruchy.",
  },
] as const;

const GESTURE_CHOICES: {
  gesture: HubGesture;
  title: string;
}[] = [
  { gesture: "przyjmij", title: "Przyjmij" },
  { gesture: "wydaj", title: "Wydaj" },
  { gesture: "przenies", title: "Przenieś" },
];

const FIELD_LABEL_PL: Record<string, string> = {
  item: "pozycję",
  location: "lokalizację",
  fromLocation: "lokalizację źródłową",
  toLocation: "lokalizację docelową",
  qty: "ilość",
};

/**
 * Hall landing for magazynier: scan first, process tiles beside.
 * Procedure is chosen only after a scan (or via a tile that opens F007 forms).
 */
export function ScanHub() {
  const [manual, setManual] = useState("");
  // Camera off by default so process tiles + shortcuts fit the first viewport;
  // hall user turns it on when ready to scan.
  const [cameraOn, setCameraOn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedScan | null>(null);

  async function resolveCode(raw: string) {
    const code = raw.trim();
    if (!code) return;
    setPending(true);
    setError(null);
    try {
      const itemRes = await fetch(
        `/api/catalog/by-barcode/${encodeURIComponent(code)}`,
      );
      if (itemRes.ok) {
        const data = (await itemRes.json()) as { item: ScannedCatalogItem };
        setResolved({ kind: "item", item: data.item });
        setManual("");
        setCameraOn(false);
        return;
      }

      const locRes = await fetch(
        `/api/locations/by-code/${encodeURIComponent(code)}`,
      );
      if (locRes.ok) {
        const data = (await locRes.json()) as { location: PickedLocation };
        setResolved({ kind: "location", location: data.location });
        setManual("");
        setCameraOn(false);
        return;
      }

      setError("Nie znaleziono pozycji ani lokalizacji o tym kodzie");
    } finally {
      setPending(false);
    }
  }

  function clearScan() {
    setResolved(null);
    setError(null);
    setCameraOn(true);
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Hala
      </h1>
      <p className="mt-1 text-zinc-600">
        Zeskanuj kod pozycji lub lokalizacji — albo wybierz czynność.
      </p>

      <section className="mt-8 space-y-3" aria-label="Skan hub">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Skan
        </h2>

        {resolved ? (
          <div
            className="space-y-4 border border-emerald-200 bg-emerald-50 px-4 py-3"
            data-testid="hub-scan-resolved"
            data-scan-kind={resolved.kind}
          >
            <p className="text-sm text-emerald-950">
              {resolved.kind === "item" ? (
                <>
                  Zeskanowano pozycję:{" "}
                  <strong>{resolved.item.name}</strong>{" "}
                  <span className="font-mono text-zinc-700">
                    ({resolved.item.barcode})
                  </span>
                </>
              ) : (
                <>
                  Zeskanowano lokalizację:{" "}
                  <strong>{resolved.location.label}</strong>{" "}
                  <span className="font-mono text-zinc-700">
                    ({resolved.location.code})
                  </span>
                </>
              )}
            </p>
            <p className="text-sm text-zinc-700">
              Co chcesz zrobić? Formularz zapyta tylko o brakujące pola.
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {GESTURE_CHOICES.map((choice) => {
                const scan =
                  resolved.kind === "item"
                    ? { kind: "item" as const, id: resolved.item.id }
                    : {
                        kind: "location" as const,
                        id: resolved.location.id,
                      };
                const href = hubGestureHref(choice.gesture, scan);
                const missing = missingFieldsAfterHubScan(
                  resolved.kind,
                  choice.gesture,
                );
                return (
                  <li key={choice.gesture}>
                    <Link
                      href={href}
                      className="block rounded bg-zinc-900 px-3 py-3 text-center text-sm font-medium text-white hover:bg-zinc-800"
                      data-testid={`hub-gesture-${choice.gesture}`}
                      data-missing-fields={missing.join(",")}
                    >
                      {choice.title}
                      <span className="mt-1 block text-xs font-normal text-zinc-300">
                        Brakuje:{" "}
                        {missing.map((f) => FIELD_LABEL_PL[f]).join(", ")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="text-sm text-zinc-700 underline"
              onClick={clearScan}
            >
              Inny skan
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
                  void resolveCode(value);
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
                  void resolveCode(manual);
                }}
                placeholder="Kod pozycji lub lokalizacji…"
                className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
                aria-label="Kod kreskowy pozycji lub lokalizacji"
                autoComplete="off"
                disabled={pending}
                data-testid="hub-scan-input"
              />
              <button
                type="button"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                disabled={pending}
                onClick={() => void resolveCode(manual)}
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
      </section>

      <section className="mt-10" aria-label="Czynności">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Czynności
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {PROCESS_TILES.map((tile) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="flex h-full flex-col rounded border border-zinc-200 bg-white px-4 py-4 hover:border-zinc-400 hover:bg-zinc-50"
                data-testid={`hub-tile-${tile.title.toLowerCase()}`}
              >
                <span className="text-lg font-semibold text-zinc-900">
                  {tile.title}
                </span>
                <span className="mt-1 text-sm text-zinc-600">{tile.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8" aria-label="Skróty">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Skróty
        </h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          <li>
            <Link
              href="/spis"
              className="inline-block rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
              data-testid="hub-shortcut-inwentaryzacja"
            >
              Inwentaryzacja
            </Link>
          </li>
          <li>
            <Link
              href="/renowacja"
              className="inline-block rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
              data-testid="hub-shortcut-renowacja"
            >
              Renowacja
            </Link>
          </li>
        </ul>
      </section>

      <section className="mt-10 border-t border-zinc-200 pt-6">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Więcej</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-700">
          <li>
            <Link href="/katalog" className="underline hover:text-zinc-900">
              Katalog
            </Link>
          </li>
          <li>
            <Link href="/lokalizacje" className="underline hover:text-zinc-900">
              Lokalizacje
            </Link>
          </li>
          <li>
            <Link href="/stany" className="underline hover:text-zinc-900">
              Stany
            </Link>
          </li>
          <li>
            <Link href="/zakupy" className="underline hover:text-zinc-900">
              Listy zakupów
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
