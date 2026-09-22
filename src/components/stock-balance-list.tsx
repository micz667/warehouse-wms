"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

type BalanceRow = {
  catalogItemId: string;
  locationId: string;
  qty: string;
  itemSku: string;
  itemName: string;
  itemUnit: string;
  locationCode: string;
  locationLabel: string;
};

export function StockBalanceList() {
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/stock");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać stanów");
        return;
      }
      const data = (await res.json()) as { balances: BalanceRow[] };
      setBalances(data.balances);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Stany magazynowe
      </h1>
      <p className="mt-1 text-zinc-600">
        Ilość = suma ruchów (w tym otwarcie ze spisu). Bez ręcznej edycji stanu.
      </p>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-8 divide-y divide-zinc-200 border-t border-zinc-200">
        {balances.length === 0 && !pending ? (
          <li className="py-10 text-center text-sm text-zinc-500">
            Brak stanów — zatwierdź spis z natury, aby otworzyć ilości.
          </li>
        ) : null}
        {balances.map((row) => (
          <li
            key={`${row.catalogItemId}:${row.locationId}`}
            className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-zinc-900">
                {row.itemName}{" "}
                <span className="font-normal text-zinc-500">({row.itemSku})</span>
              </p>
              <p className="text-sm text-zinc-600">
                {row.locationLabel}{" "}
                <span className="font-mono">({row.locationCode})</span>
              </p>
            </div>
            <span className="text-lg font-semibold tabular-nums text-zinc-900">
              {row.qty} {row.itemUnit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
