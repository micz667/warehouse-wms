"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  STOCKTAKE_KIND_LABEL_PL,
  STOCKTAKE_STATUS_LABEL_PL,
} from "@/lib/stocktake-labels";

type CatalogHit = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  barcode: string;
};

type LocationHit = {
  id: string;
  code: string;
  label: string;
};

type LineRow = {
  id: string;
  countedQty: string;
  systemQty: string | null;
  variance: string | null;
  catalogItem: CatalogHit;
  location: LocationHit;
};

type SessionDetail = {
  id: string;
  status: keyof typeof STOCKTAKE_STATUS_LABEL_PL;
  kind: keyof typeof STOCKTAKE_KIND_LABEL_PL;
  note: string | null;
  approvedAt: string | null;
  lines: LineRow[];
};

type Props = {
  sessionId: string;
  canWrite: boolean;
};

function formatSigned(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (n > 0) return `+${value}`;
  return value;
}

export function StocktakeSessionPanel({ sessionId, canWrite }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const [itemQuery, setItemQuery] = useState("");
  const [itemHits, setItemHits] = useState<CatalogHit[]>([]);
  const [pickedItem, setPickedItem] = useState<CatalogHit | null>(null);
  const [createNew, setCreateNew] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Ogólne");
  const [newUnit, setNewUnit] = useState("szt");

  const [locCode, setLocCode] = useState("");
  const [pickedLoc, setPickedLoc] = useState<LocationHit | null>(null);
  const [qty, setQty] = useState("");

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/stocktakes/${sessionId}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać sesji");
        return;
      }
      const data = (await res.json()) as { session: SessionDetail };
      setSession(data.session);
    });
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function searchItems(q: string) {
    setItemQuery(q);
    if (!q.trim()) {
      setItemHits([]);
      return;
    }
    const res = await fetch(`/api/catalog?q=${encodeURIComponent(q.trim())}`);
    if (!res.ok) return;
    const data = (await res.json()) as { items: CatalogHit[] };
    setItemHits(data.items.slice(0, 8));
  }

  async function resolveLocation() {
    const raw = locCode.trim();
    if (!raw) return;
    setError(null);
    const res = await fetch(
      `/api/locations/by-code/${encodeURIComponent(raw)}`,
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Nie znaleziono lokalizacji");
      return;
    }
    const data = (await res.json()) as { location: LocationHit };
    setPickedLoc(data.location);
    setLocCode("");
  }

  async function startCounting() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stocktakes/${sessionId}/start`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się rozpocząć liczenia");
        return;
      }
      load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/stocktakes/${sessionId}/approve`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się zatwierdzić spisu");
        return;
      }
      load();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function addLine(event: React.FormEvent) {
    event.preventDefault();
    if (!pickedLoc) {
      setError("Wybierz lokalizację");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        locationId: pickedLoc.id,
        countedQty: qty,
      };
      if (createNew) {
        payload.newItem = {
          sku: newSku,
          name: newName,
          category: newCategory,
          unit: newUnit,
        };
      } else if (pickedItem) {
        payload.catalogItemId = pickedItem.id;
      } else {
        setError("Wybierz pozycję katalogu lub utwórz nową");
        return;
      }

      const res = await fetch(`/api/stocktakes/${sessionId}/lines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się dodać pozycji");
        return;
      }

      setQty("");
      setPickedItem(null);
      setItemQuery("");
      setItemHits([]);
      setCreateNew(false);
      setNewSku("");
      setNewName("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function removeLine(lineId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stocktakes/${sessionId}/lines/${lineId}`,
        { method: "DELETE" },
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się usunąć pozycji");
        return;
      }
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Wczytywanie…</p>
        )}
      </div>
    );
  }

  const isInventory = session.kind === "inventory";
  const editable =
    canWrite &&
    (session.status === "draft" || session.status === "counting");
  const canStart = canWrite && session.status === "draft";
  const canApprove = canWrite && session.status === "counting";
  const kindLabel =
    STOCKTAKE_KIND_LABEL_PL[session.kind] ?? "Spis";

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/spis" className="hover:text-zinc-800">
              ← Spisy
            </Link>
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {kindLabel} · {STOCKTAKE_STATUS_LABEL_PL[session.status]}
          </h1>
          <p className="mt-1 text-zinc-600">
            {session.note ??
              (isInventory
                ? "Inwentaryzacja — liczenie względem stanu systemowego"
                : "Sesja spisu z natury")}
            {session.approvedAt
              ? ` · zatwierdzono ${new Date(session.approvedAt).toLocaleString("pl-PL")}`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canStart ? (
            <button
              type="button"
              disabled={busy}
              onClick={startCounting}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Rozpocznij liczenie
            </button>
          ) : null}
          {canApprove ? (
            <button
              type="button"
              disabled={busy}
              onClick={approve}
              className="rounded bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isInventory
                ? "Zatwierdź (korekty stanów)"
                : "Zatwierdź (ruchy otwarcia)"}
            </button>
          ) : null}
          {session.status === "approved" ? (
            <Link
              href="/stany"
              className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Zobacz stany
            </Link>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {isInventory && session.status === "counting" && session.lines.length > 0 ? (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Przed zatwierdzeniem: odchylenie = policzone − stan systemowy (suma
          ruchów). Zatwierdzenie zapisze korekty tylko dla pozycji z odchyleniem
          ≠ 0.
        </p>
      ) : null}

      {editable ? (
        <form
          onSubmit={addLine}
          className="mt-8 space-y-4 border-t border-zinc-200 pt-8"
        >
          <h2 className="text-lg font-semibold text-zinc-900">
            Dodaj pozycję liczenia
          </h2>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!createNew}
                onChange={() => setCreateNew(false)}
              />
              Z katalogu
            </label>
            {!isInventory ? (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={createNew}
                  onChange={() => setCreateNew(true)}
                />
                Nowa pozycja
              </label>
            ) : null}
          </div>

          {!createNew || isInventory ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Pozycja katalogu
              </label>
              <input
                type="search"
                value={itemQuery}
                onChange={(e) => void searchItems(e.target.value)}
                placeholder="Szukaj nazwy, SKU, kodu…"
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
              {pickedItem ? (
                <p className="mt-2 text-sm text-emerald-800">
                  Wybrano: <strong>{pickedItem.name}</strong> ({pickedItem.sku})
                </p>
              ) : null}
              {itemHits.length > 0 ? (
                <ul className="mt-2 max-h-40 overflow-auto border border-zinc-200 bg-white">
                  {itemHits.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-zinc-100"
                        onClick={() => {
                          setPickedItem(item);
                          setItemQuery(item.name);
                          setItemHits([]);
                        }}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="ml-2 text-zinc-500">{item.sku}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="SKU">
                <input
                  required={createNew}
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Nazwa">
                <input
                  required={createNew}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Kategoria">
                <input
                  required={createNew}
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Jednostka">
                <input
                  required={createNew}
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </Field>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Lokalizacja (kod / skan)
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={locCode}
                onChange={(e) => setLocCode(e.target.value)}
                placeholder="Kod lokalizacji…"
                className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={() => void resolveLocation()}
                className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-100"
              >
                Użyj kodu
              </button>
            </div>
            {pickedLoc ? (
              <p className="mt-2 text-sm text-emerald-800">
                Lokalizacja: <strong>{pickedLoc.label}</strong>{" "}
                <span className="font-mono">({pickedLoc.code})</span>
              </p>
            ) : null}
            <p className="mt-1 text-xs text-zinc-500">
              Pełny wybór z listy:{" "}
              <Link href="/lokalizacje/wybierz" className="underline">
                wybierz lokalizację
              </Link>
            </p>
          </div>

          <Field label="Ilość policzona">
            <input
              required
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full max-w-xs rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </Field>

          <button
            type="submit"
            disabled={busy}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Zapisz pozycję
          </button>
        </form>
      ) : null}

      <div className="mt-10 border-t border-zinc-200 pt-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Pozycje ({session.lines.length})
        </h2>
        <ul className="mt-4 divide-y divide-zinc-200">
          {session.lines.length === 0 ? (
            <li className="py-6 text-sm text-zinc-500">
              Brak pozycji — dodaj pierwsze liczenie.
            </li>
          ) : null}
          {session.lines.map((line) => {
            const varianceNum =
              line.variance != null ? Number(line.variance) : null;
            const varianceTone =
              varianceNum == null
                ? "text-zinc-900"
                : varianceNum === 0
                  ? "text-zinc-600"
                  : varianceNum > 0
                    ? "text-emerald-800"
                    : "text-red-800";

            return (
              <li
                key={line.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {line.catalogItem.name}{" "}
                    <span className="font-normal text-zinc-500">
                      ({line.catalogItem.sku})
                    </span>
                  </p>
                  <p className="text-sm text-zinc-600">
                    {line.location.label}{" "}
                    <span className="font-mono">({line.location.code})</span>
                  </p>
                  {isInventory && line.systemQty != null ? (
                    <p className="mt-1 text-sm text-zinc-600">
                      System:{" "}
                      <span className="tabular-nums">{line.systemQty}</span>
                      {" · "}
                      Policzono:{" "}
                      <span className="tabular-nums">
                        {String(line.countedQty)}
                      </span>
                      {" · "}
                      Odchylenie:{" "}
                      <span className={`font-semibold tabular-nums ${varianceTone}`}>
                        {formatSigned(line.variance ?? "0")}
                      </span>{" "}
                      {line.catalogItem.unit}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {!isInventory ? (
                    <span className="text-lg font-semibold tabular-nums text-zinc-900">
                      {String(line.countedQty)} {line.catalogItem.unit}
                    </span>
                  ) : (
                    <span
                      className={`text-lg font-semibold tabular-nums ${varianceTone}`}
                      title="Odchylenie (policzone − system)"
                    >
                      {formatSigned(line.variance ?? "0")}{" "}
                      {line.catalogItem.unit}
                    </span>
                  )}
                  {editable ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeLine(line.id)}
                      className="text-sm text-red-700 hover:underline disabled:opacity-60"
                    >
                      Usuń
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
