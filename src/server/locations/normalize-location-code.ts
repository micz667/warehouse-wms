/**
 * Hall location codes are typed or scanned as Code128.
 * Normalize for uniqueness: trim, uppercase, collapse interior whitespace to `-`.
 */
export function normalizeLocationCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const collapsed = trimmed.replace(/\s+/g, "-").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{0,63}$/.test(collapsed)) {
    return null;
  }
  return collapsed;
}
