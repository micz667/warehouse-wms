/** SKU for hall inline create when the user only scanned a barcode (F011). */
export function skuFromScannedBarcode(barcode: string): string {
  const safe = barcode.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 28);
  return `R-${safe || Date.now().toString(36)}`;
}
