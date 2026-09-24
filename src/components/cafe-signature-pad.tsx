"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  cafeIssueId: string;
  canSign: boolean;
};

/**
 * Floor finger-sign pad for cafe receipt (F013b).
 * POSTs signature data URL to /api/cafe-issues/[id]/sign — no nested forms.
 */
export function CafeSignaturePad({ cafeIssueId, canSign }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const width = Math.max(parent.clientWidth, 280);
    const height = 180;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setHasInk(false);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  function pointFromEvent(
    e: React.PointerEvent<HTMLCanvasElement>,
  ): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canSign || pending) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasInk(true);
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  function clearPad() {
    setError(null);
    resizeCanvas();
  }

  async function submitSign() {
    setError(null);
    if (!canSign) {
      setError("Brak uprawnień do podpisu");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) {
      setError("Narysuj podpis na polu");
      return;
    }
    setPending(true);
    try {
      const signatureData = canvas.toDataURL("image/png");
      const res = await fetch(
        `/api/cafe-issues/${encodeURIComponent(cafeIssueId)}/sign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatureData }),
        },
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(body?.error ?? "Nie udało się zapisać podpisu");
        return;
      }
      router.refresh();
    } catch {
      setError("Błąd sieci — spróbuj ponownie");
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="space-y-3"
      data-testid="cafe-signature-pad"
      aria-label="Podpis odbioru"
    >
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Podpis odbioru
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Odbiorca podpisuje palcem — dopiero wtedy stan zejdzie z magazynu.
        </p>
      </div>

      <div className="overflow-hidden rounded border border-zinc-300 bg-white touch-none">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair touch-none"
          data-testid="cafe-signature-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearPad}
          disabled={!canSign || pending}
          className="flex-1 rounded border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
          data-testid="cafe-signature-clear"
        >
          Wyczyść
        </button>
        <button
          type="button"
          onClick={() => void submitSign()}
          disabled={!canSign || pending || !hasInk}
          className="flex-1 rounded bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          data-testid="cafe-signature-submit"
        >
          {pending ? "Zapisywanie…" : "Podpisz odbiór"}
        </button>
      </div>
    </section>
  );
}
