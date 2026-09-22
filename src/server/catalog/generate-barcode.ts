import { randomBytes } from "node:crypto";

/**
 * Code128 symbology (subset B): alphanumeric payload safe for JsBarcode `CODE128`.
 * Format: WMS + 12 hex chars → unique enough for hall labels; caller must enforce DB uniqueness.
 */
export function generateBarcodeValue(): string {
  return `WMS${randomBytes(6).toString("hex").toUpperCase()}`;
}
