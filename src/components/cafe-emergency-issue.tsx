"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  cafeIssueId: string;
  canIssue: boolean;
};

/**
 * Conscious emergency bypass of cafe signature (F018).
 * Two-step hall UI: reveal form → reason + explicit confirm — not a single
 * accidental tap on prepare or the normal sign action.
 */
export function CafeEmergencyIssue({ cafeIssueId, canIssue }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submitEmergency() {
    setError(null);
    if (!canIssue) {
      setError("Brak uprawnień do wydania awaryjnego");
      return;
    }
    if (!confirmed) {
      setError("Zaznacz świadome potwierdzenie wydania bez podpisu");
      return;
    }
    if (!note.trim()) {
      setError("Podaj powód wydania awaryjnego");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(
        `/api/cafe-issues/${encodeURIComponent(cafeIssueId)}/emergency-issue`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmed: true,
            emergencyNote: note.trim(),
          }),
        },
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się wydać awaryjnie");
        return;
      }
      router.refresh();
    } catch {
      setError("Błąd sieci — spróbuj ponownie");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <section
        className="space-y-2 border-t border-zinc-200 pt-4"
        data-testid="cafe-emergency-issue"
        aria-label="Wydanie awaryjne bez podpisu"
      >
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          disabled={!canIssue || pending}
          className="w-full rounded border border-amber-700 bg-white px-4 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50"
          data-testid="cafe-emergency-open"
        >
          Wydaj bez podpisu (awaria)
        </button>
        <p className="text-xs text-zinc-500">
          Tylko gdy podpis na miejscu jest niemożliwy — wymaga potwierdzenia i
          powodu.
        </p>
      </section>
    );
  }

  return (
    <section
      className="space-y-3 border-t border-amber-200 bg-amber-50/60 px-3 py-4"
      data-testid="cafe-emergency-issue"
      aria-label="Wydanie awaryjne bez podpisu"
    >
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-amber-900">
          Wydanie awaryjne
        </h2>
        <p className="mt-1 text-sm text-amber-950">
          Stan zejdzie z magazynu bez podpisu palcem. To nie jest zwykłe
          przygotowanie paczki — potwierdź świadomie.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-zinc-800">
          Powód / notatka
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={!canIssue || pending}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          placeholder="Np. odbiorca niedostępny, awaria tabletu…"
          data-testid="cafe-emergency-note"
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-900">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={!canIssue || pending}
          className="mt-0.5"
          data-testid="cafe-emergency-confirm"
        />
        <span>
          Potwierdzam świadome wydanie bez podpisu — stan magazynu zostanie
          obniżony.
        </span>
      </label>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmed(false);
            setNote("");
            setError(null);
          }}
          disabled={pending}
          className="flex-1 rounded border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          data-testid="cafe-emergency-cancel"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={() => void submitEmergency()}
          disabled={!canIssue || pending || !confirmed || !note.trim()}
          className="flex-1 rounded bg-amber-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          data-testid="cafe-emergency-submit"
        >
          {pending ? "Wydawanie…" : "Wydaj bez podpisu"}
        </button>
      </div>
    </section>
  );
}
