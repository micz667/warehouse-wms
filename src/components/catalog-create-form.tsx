"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CatalogCreateForm() {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("szt");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, name, category, unit }),
      });
      const body = (await res.json().catch(() => null)) as
        | { item?: { id: string }; error?: string }
        | null;
      if (!res.ok || !body?.item) {
        setError(body?.error ?? "Nie udało się utworzyć pozycji");
        return;
      }
      router.push(`/katalog/${body.item.id}`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-lg px-6 py-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Nowa pozycja
      </h1>
      <p className="mt-1 text-zinc-600">
        Kod kreskowy Code128 zostanie wygenerowany automatycznie.
      </p>

      <div className="mt-8 space-y-4">
        <Field label="SKU" id="sku">
          <input
            id="sku"
            required
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Nazwa" id="name">
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Kategoria" id="category">
          <input
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Jednostka" id="unit">
          <input
            id="unit"
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
            placeholder="szt, m, kg…"
          />
        </Field>
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
          href="/katalog"
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
        >
          Anuluj
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
