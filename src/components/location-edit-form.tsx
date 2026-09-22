"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarcodeLabel } from "@/components/barcode-label";

export type LocationView = {
  id: string;
  code: string;
  label: string;
};

type Props = {
  location: LocationView;
  canWrite: boolean;
};

export function LocationEditForm({ location, canWrite }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(location.code);
  const [label, setLabel] = useState(location.label);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, label }),
      });
      const body = (await res.json().catch(() => null)) as
        | { location?: LocationView; error?: string }
        | null;
      if (!res.ok || !body?.location) {
        setError(body?.error ?? "Nie udało się zapisać");
        return;
      }
      setCode(body.location.code);
      setLabel(body.location.label);
      setMessage("Zapisano zmiany");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {location.label}
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">{location.code}</p>
        </div>
        <Link
          href={`/lokalizacje/${location.id}/etykieta`}
          className="shrink-0 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
        >
          Etykieta
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded border border-zinc-200 bg-white p-4">
        <BarcodeLabel value={location.code} />
      </div>

      <form onSubmit={onSave} className="mt-8 space-y-4">
        <label className="block" htmlFor="code">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Kod
          </span>
          <input
            id="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!canWrite}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm disabled:bg-zinc-100"
          />
        </label>
        <label className="block" htmlFor="label">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Nazwa
          </span>
          <input
            id="label"
            required
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={!canWrite}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:bg-zinc-100"
          />
        </label>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          {canWrite ? (
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? "Zapisywanie…" : "Zapisz"}
            </button>
          ) : (
            <p className="text-sm text-zinc-500">Tryb podglądu (bez edycji).</p>
          )}
          <Link
            href="/lokalizacje"
            className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
          >
            Wróć do listy
          </Link>
        </div>
      </form>
    </div>
  );
}
