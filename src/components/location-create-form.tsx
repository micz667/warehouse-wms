"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LocationCreateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [isRenovation, setIsRenovation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, label, isRenovation }),
      });
      const body = (await res.json().catch(() => null)) as
        | { location?: { id: string }; error?: string }
        | null;
      if (!res.ok || !body?.location) {
        setError(body?.error ?? "Nie udało się utworzyć lokalizacji");
        return;
      }
      router.push(`/lokalizacje/${body.location.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-lg px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Nowa lokalizacja
      </h1>
      <p className="mt-1 text-zinc-600">
        Kod będzie wartością etykiety Code128 (skan w ruchach później).
      </p>

      <div className="mt-8 space-y-4">
        <label className="block" htmlFor="code">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Kod
          </span>
          <input
            id="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm"
            placeholder="np. A-01-02"
            autoComplete="off"
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
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
            placeholder="np. Regał A, półka 1"
          />
        </label>
        <label className="flex items-center gap-2" htmlFor="isRenovation">
          <input
            id="isRenovation"
            type="checkbox"
            checked={isRenovation}
            onChange={(e) => setIsRenovation(e.target.checked)}
            className="size-4 rounded border-zinc-300"
            data-testid="location-is-renovation"
          />
          <span className="text-sm text-zinc-800">
            Sekcja renowacji (zwroty uszkodzone / brudne)
          </span>
        </label>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {saving ? "Zapisywanie…" : "Utwórz"}
        </button>
        <Link
          href="/lokalizacje"
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
        >
          Anuluj
        </Link>
      </div>
    </form>
  );
}
