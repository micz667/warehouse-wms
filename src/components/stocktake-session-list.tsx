"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  STOCKTAKE_KIND_LABEL_PL,
  STOCKTAKE_STATUS_LABEL_PL,
} from "@/lib/stocktake-labels";

type SessionRow = {
  id: string;
  status: keyof typeof STOCKTAKE_STATUS_LABEL_PL;
  kind: keyof typeof STOCKTAKE_KIND_LABEL_PL;
  note: string | null;
  createdAt: string;
  approvedAt: string | null;
  _count: { lines: number };
};

type Props = {
  canWrite: boolean;
};

export function StocktakeSessionList({ canWrite }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState<"opening" | "inventory" | null>(
    null,
  );

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/stocktakes");
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Nie udało się wczytać spisów");
        return;
      }
      const data = (await res.json()) as { sessions: SessionRow[] };
      setSessions(data.sessions);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createSession(kind: "opening" | "inventory") {
    setCreating(kind);
    setError(null);
    try {
      const res = await fetch("/api/stocktakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const body = (await res.json().catch(() => null)) as {
        session?: { id: string };
        error?: string;
      } | null;
      if (!res.ok || !body?.session) {
        setError(body?.error ?? "Nie udało się utworzyć sesji");
        return;
      }
      router.push(`/spis/${body.session.id}`);
      router.refresh();
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Spis i inwentaryzacja
          </h1>
          <p className="mt-1 text-zinc-600">
            Otwarcie zakłada stany początkowe. Inwentaryzacja liczy na hali,
            pokazuje odchylenia i po zatwierdzeniu koryguje ruchy.
          </p>
        </div>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void createSession("inventory")}
              disabled={creating !== null}
              className="inline-flex items-center justify-center rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {creating === "inventory"
                ? "Tworzenie…"
                : "Nowa inwentaryzacja"}
            </button>
            <button
              type="button"
              onClick={() => void createSession("opening")}
              disabled={creating !== null}
              className="inline-flex items-center justify-center rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
            >
              {creating === "opening" ? "Tworzenie…" : "Spis otwarcia"}
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-8 divide-y divide-zinc-200 border-t border-zinc-200">
        {sessions.length === 0 && !pending ? (
          <li className="py-10 text-center text-sm text-zinc-500">
            Brak sesji spisu.
          </li>
        ) : null}
        {sessions.map((session) => (
          <li key={session.id}>
            <Link
              href={`/spis/${session.id}`}
              className="flex flex-col gap-1 py-4 hover:bg-zinc-100/80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-zinc-900">
                  {STOCKTAKE_KIND_LABEL_PL[session.kind] ?? "Spis"} ·{" "}
                  {STOCKTAKE_STATUS_LABEL_PL[session.status]}
                  {session.note ? (
                    <span className="font-normal text-zinc-600">
                      {" "}
                      — {session.note}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm text-zinc-600">
                  Pozycji: {session._count.lines} ·{" "}
                  {new Date(session.createdAt).toLocaleString("pl-PL")}
                </p>
              </div>
              <span className="text-sm text-zinc-500">Otwórz →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
