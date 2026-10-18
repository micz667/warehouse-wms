/**
 * Format allocated item code: PREFIX + hyphen + zero-padded number (min 4 digits).
 * Grows past 9999 without wrapping (10000 → "PREFIX-10000").
 */
export function formatItemCode(prefix: string, number: number): string {
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`item code number must be a positive integer, got ${number}`);
  }
  const digits = String(number).padStart(4, "0");
  return `${prefix}-${digits}`;
}

/** Parse `KRZ-0042` → { prefix, number } or null. */
export function parseItemCode(
  code: string,
): { prefix: string; number: number } | null {
  const m = code.trim().match(/^([A-Z]{2,4})-(\d+)$/);
  if (!m) return null;
  return { prefix: m[1], number: Number(m[2]) };
}
