"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  ItemScanField,
  type ScannedCatalogItem,
} from "@/components/item-scan-field";

type LocationRow = {
  locationId: string;
  locationCode: string;
  locationLabel: string;
  qty: string;
};

type Props = {
  initialItem?: ScannedCatalogItem | null;
};

/**
 * Hall “gdzie leży X?” — scan (or prefill) one item, list locations with
 * positive movement-sum balance.
 */
export function LocateItem({ initialItem = null }: Props) {
  const [item, setItem] = useState<ScannedCatalogItem | null>(initialItem);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [total, setTotal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback((catalogItemId: string) => {
    startTransition(async () => {
      setError(null);
      const res = await fetch(
        `/api/stock/item/${encodeURIComponent(catalogItemId)}`,
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        locations?: LocationRow[];
        total?: string;
      } | null;
      if (!res.ok || !body?.locations || body.total === undefined) {
        setError(body?.error ?? "Nie udało się pobrać lokalizacji");
        setLocations([]);
        setTotal(null);
        return;
      }
      setLocations(body.locations);
      setTotal(body.total);
    });
  }, []);

  useEffect(() => {
    if (!item) return;
    load(item.id);
  }, [item, load]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Gdzie leży?
        </h1>
        <p className="mt-1 text-zinc-600">
          Zeskanuj pozycję — pokażemy lokalizacje ze stanem (suma ruchów).
        </p>
      </div>

      <ItemScanField
        selected={item}
        onSelect={(next) => {
          setItem(next);
          setError(null);
          if (!next) {
            setLocations([]);
            setTotal(null);
          }
        }}
      />

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {item && !pending && total !== null ? (
        <section aria-label="Lokalizacje ze stanem" data-testid="locate-results">
          <p className="text-sm text-zinc-600">
            Razem:{" "}
            <strong className="tabular-nums text-zinc-900">
              {total} {item.unit}
            </strong>
          </p>
          {locations.length === 0 ? (
            <p
              className="mt-4 text-sm text-zinc-500"
              data-testid="locate-empty"
            >
              Brak stanu — pozycja nie leży na żadnej lokalizacji.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-200 border-t border-zinc-200">
              {locations.map((row) => (
                <li
                  key={row.locationId}
                  className="flex items-center justify-between gap-3 py-3"
                  data-testid="locate-location-row"
                  data-location-id={row.locationId}
                  data-qty={row.qty}
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {row.locationLabel}
                    </p>
                    <p className="font-mono text-sm text-zinc-600">
                      {row.locationCode}
                    </p>
                  </div>
                  <span className="text-lg font-semibold tabular-nums text-zinc-900">
                    {row.qty} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {pending && item ? (
        <p className="text-sm text-zinc-500" role="status">
          Szukam…
        </p>
      ) : null}
    </div>
  );
}
