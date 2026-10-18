"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarcodeLabel } from "@/components/barcode-label";

export type CatalogItemView = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  barcode: string;
  externalBarcode?: string | null;
  photoPath: string | null;
};

type Props = {
  item: CatalogItemView;
  canWrite: boolean;
};

export function CatalogEditForm({ item, canWrite }: Props) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [unit, setUnit] = useState(item.unit);
  const [externalBarcode, setExternalBarcode] = useState(
    item.externalBarcode ?? "",
  );
  const [photoPath, setPhotoPath] = useState(item.photoPath);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/catalog/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          unit,
          externalBarcode: externalBarcode.trim() || null,
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { item?: CatalogItemView; error?: string }
        | null;
      if (!res.ok || !body?.item) {
        setError(body?.error ?? "Nie udało się zapisać");
        return;
      }
      setMessage("Zapisano zmiany");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onPhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !canWrite) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("photo", file);
      const res = await fetch(`/api/catalog/${item.id}/photo`, {
        method: "POST",
        body: form,
      });
      const body = (await res.json().catch(() => null)) as
        | { item?: CatalogItemView; error?: string }
        | null;
      if (!res.ok || !body?.item) {
        setError(body?.error ?? "Nie udało się wgrać zdjęcia");
        return;
      }
      setPhotoPath(body.item.photoPath);
      setMessage("Zdjęcie zapisane");
      router.refresh();
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {item.name}
          </h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">{item.barcode}</p>
          <p className="mt-1 text-sm text-zinc-600">
            Kategoria (bieżąca): {item.category}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href={`/gdzie?itemId=${encodeURIComponent(item.id)}`}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
            data-testid="catalog-locate-link"
          >
            Gdzie leży?
          </Link>
          <Link
            href={`/ruchy/historia?catalogItemId=${encodeURIComponent(item.id)}`}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
            data-testid="catalog-history-link"
          >
            Historia
          </Link>
          <Link
            href={`/katalog/${item.id}/etykieta`}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100"
            data-testid="catalog-reprint-label"
          >
            Etykieta / przedruk
          </Link>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        {photoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPath}
            alt={item.name}
            className="h-24 w-24 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center bg-zinc-200 text-xs text-zinc-500">
            brak zdjęcia
          </div>
        )}
        {canWrite ? (
          <label className="text-sm text-zinc-700">
            <span className="mb-1 block font-medium">Zdjęcie (opcjonalne)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPhotoChange}
              disabled={uploading}
              className="block w-full text-sm"
            />
          </label>
        ) : null}
      </div>

      <div className="mt-6 overflow-x-auto rounded border border-zinc-200 bg-white p-4">
        <p className="mb-2 text-center text-sm font-medium text-zinc-800">
          {item.name}
        </p>
        <BarcodeLabel value={item.barcode} />
      </div>

      <form onSubmit={onSave} className="mt-8 space-y-4">
        <Field label="Kod (SKU / Code128)" id="sku">
          <input
            id="sku"
            value={item.sku}
            readOnly
            disabled
            className="w-full rounded border border-zinc-300 bg-zinc-100 px-3 py-2 font-mono text-sm"
            data-testid="catalog-code-readonly"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Kod jest stały po przydzieleniu — zmiana kategorii nie zmienia
            numeru (etykiety już wydrukowane).
          </p>
        </Field>
        <Field label="Nazwa" id="name">
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canWrite}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:bg-zinc-100"
          />
        </Field>
        <Field label="Kategoria (bieżąca)" id="category">
          <input
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={!canWrite}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:bg-zinc-100"
            data-testid="catalog-category-field"
          />
        </Field>
        <Field label="Jednostka" id="unit">
          <input
            id="unit"
            required
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={!canWrite}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:bg-zinc-100"
          />
        </Field>
        <Field label="Kod producenta (opcjonalny)" id="externalBarcode">
          <input
            id="externalBarcode"
            value={externalBarcode}
            onChange={(e) => setExternalBarcode(e.target.value)}
            disabled={!canWrite}
            className="w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm disabled:bg-zinc-100"
            data-testid="catalog-external-barcode"
          />
        </Field>

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
            href="/katalog"
            className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
          >
            Wróć do listy
          </Link>
        </div>
      </form>
    </div>
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
