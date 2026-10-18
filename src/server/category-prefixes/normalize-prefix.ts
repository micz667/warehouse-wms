/**
 * Map Polish (and common Latin) letters to uppercase ASCII for category prefixes.
 * Ł→L, Ż→Z, Ą→A, etc. Non-letters stripped; result uppercased.
 */
const PL_MAP: Record<string, string> = {
  ą: "A",
  ć: "C",
  ę: "E",
  ł: "L",
  ń: "N",
  ó: "O",
  ś: "S",
  ź: "Z",
  ż: "Z",
  Ą: "A",
  Ć: "C",
  Ę: "E",
  Ł: "L",
  Ń: "N",
  Ó: "O",
  Ś: "S",
  Ź: "Z",
  Ż: "Z",
};

export function normalizePrefixLetters(raw: string): string {
  let out = "";
  for (const ch of raw.trim()) {
    const mapped = PL_MAP[ch] ?? ch;
    if (/[a-zA-Z]/.test(mapped)) out += mapped.toUpperCase();
  }
  return out;
}
