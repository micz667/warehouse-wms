"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** Called with the decoded barcode value. */
  onScan: (value: string) => void;
  /** Pause after a successful decode until restarted. */
  active?: boolean;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

function getNativeDetector(): BarcodeDetectorLike | null {
  if (typeof window === "undefined") return null;
  const Ctor = (
    window as unknown as {
      BarcodeDetector?: new (opts?: {
        formats?: string[];
      }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({
      formats: ["code_128", "ean_13", "ean_8", "code_39", "qr_code"],
    });
  } catch {
    return null;
  }
}

/**
 * Camera barcode scan for Android Chrome PWA.
 * Prefers native BarcodeDetector; falls back to @zxing/browser.
 * Manual entry lives beside this in parent forms.
 */
export function BarcodeScanner({ onScan, active = true }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const zxingStopRef = useRef<(() => void) | null>(null);
  const lastValueRef = useRef<string>("");
  const lastAtRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "off">(
    active ? "starting" : "off",
  );

  const emit = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const now = Date.now();
      if (
        trimmed === lastValueRef.current &&
        now - lastAtRef.current < 1500
      ) {
        return;
      }
      lastValueRef.current = trimmed;
      lastAtRef.current = now;
      onScan(trimmed);
    },
    [onScan],
  );

  useEffect(() => {
    if (!active) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      zxingStopRef.current?.();
      zxingStopRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      queueMicrotask(() => setStatus("off"));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => setStatus("starting"));

    async function start() {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Kamera niedostępna — użyj wpisywania ręcznego");
        setStatus("idle");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus("live");

        const native = getNativeDetector();
        if (native) {
          const tick = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const codes = await native.detect(videoRef.current);
              if (codes[0]?.rawValue) emit(codes[0].rawValue);
            } catch {
              // frame skipped
            }
            rafRef.current = requestAnimationFrame(() => {
              void tick();
            });
          };
          rafRef.current = requestAnimationFrame(() => {
            void tick();
          });
          return;
        }

        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          video,
          (result, _err, ctrl) => {
            if (result) {
              emit(result.getText());
            }
            if (cancelled) ctrl.stop();
          },
        );
        zxingStopRef.current = () => controls.stop();
        if (cancelled) {
          controls.stop();
        }
      } catch {
        if (!cancelled) {
          setError("Brak dostępu do kamery — użyj wpisywania ręcznego");
          setStatus("idle");
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      zxingStopRef.current?.();
      zxingStopRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active, emit]);

  return (
    <div className="w-full">
      <div className="relative aspect-[4/3] overflow-hidden rounded border border-zinc-300 bg-zinc-900">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
        {status === "starting" && !error ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-200">
            Uruchamianie kamery…
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-sm text-amber-800" role="status">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          Skieruj kamerę na kod kreskowy Code128.
        </p>
      )}
    </div>
  );
}
