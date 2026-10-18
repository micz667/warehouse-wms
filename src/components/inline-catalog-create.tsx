"use client";

import { useState } from "react";
import type { ScannedCatalogItem } from "@/components/item-scan-field";

type Props = {
  barcode: string;
  onCreated: (item: ScannedCatalogItem) => void;
  onCancel: () => void;
};

/**
 * POC-style inline catalog add on Przyjmij (F011 / F020).
 * Scanned manufacturer barcode is stored as externalBarcode; warehouse
 * SKU/Code128 is the allocated category-prefix code.
 * Fieldset only — must not nest another form inside ReceiptForm.
 */
export function InlineCatalogCreate({ barcode, onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function saveItem() {
    const trimmedName = name.trim();
    const trimmedTags = tags.trim();
    if (!trimmedName || !trimmedTags) {
      setError("Nazwa i tagi są wymagane");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          category: trimmedTags,
          unit: "szt",
          description: description.trim() || null,
          barcode,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        item?: ScannedCatalogItem;
        error?: string;
      } | null;
      if (!res.ok || !body?.item) {
        setError(body?.error ?? "Nie udało się dodać pozycji");
        return;
      }
      onCreated({
        id: body.item.id,
        sku: body.item.sku,
        name: body.item.name,
        barcode: body.item.barcode,
        unit: body.item.unit,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <fieldset
      className="space-y-3 border border-amber-200 bg-amber-50 px-3 py-3"
      data-testid="inline-catalog-create"
      data-barcode={barcode}
    >
      <legend className="px-1 text-sm font-medium text-amber-950">
        Nieznany kod — dodaj do katalogu
      </legend>
      <p className="text-sm text-amber-900">
        Przydzielimy kod magazynowy z kategorii. Zeskanowany kod producenta
        zostanie zapisany osobno — też otworzy pozycję w skanerze.
      </p>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-800">Nazwa</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          autoComplete="off"
          required
          data-testid="inline-item-name"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-800">Tagi / kategoria</span>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="np. farba, wnętrze"
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          autoComplete="off"
          required
          data-testid="inline-item-tags"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-800">Opis</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          data-testid="inline-item-description"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-800">
          Kod producenta (zeskanowany)
        </span>
        <input
          type="text"
          value={barcode}
          readOnly
          className="w-full rounded border border-zinc-300 bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-800"
          data-testid="inline-item-barcode"
        />
      </label>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void saveItem()}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          data-testid="inline-item-save"
        >
          {pending ? "Zapisywanie…" : "Zapisz pozycję"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-100"
        >
          Anuluj
        </button>
      </div>
    </fieldset>
  );
}
