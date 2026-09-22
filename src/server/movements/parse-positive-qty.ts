import { Decimal } from "@prisma/client/runtime/library";

/**
 * Hall qty is always a positive magnitude; posting helpers apply the sign.
 * Rejects zero, negative, non-finite, and empty values.
 */
export function parsePositiveQty(
  raw: unknown,
): { ok: true; qty: Decimal } | { ok: false; message: string } {
  if (raw == null || raw === "") {
    return { ok: false, message: "Podaj ilość" };
  }
  let asString: string | null = null;
  if (typeof raw === "number") {
    asString = String(raw);
  } else if (typeof raw === "string") {
    asString = raw.trim().replace(",", ".");
  } else if (
    typeof raw === "object" &&
    raw !== null &&
    "toString" in raw &&
    typeof (raw as { toString: () => string }).toString === "function"
  ) {
    asString = (raw as { toString: () => string }).toString().trim();
  }
  if (asString == null || asString === "") {
    return { ok: false, message: "Podaj ilość" };
  }
  let qty: Decimal;
  try {
    qty = new Decimal(asString);
  } catch {
    return { ok: false, message: "Nieprawidłowa ilość" };
  }
  if (!qty.isFinite() || qty.lte(0)) {
    return { ok: false, message: "Ilość musi być większa od zera" };
  }
  return { ok: true, qty };
}
