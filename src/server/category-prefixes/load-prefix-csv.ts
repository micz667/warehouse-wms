import { readFileSync } from "node:fs";
import path from "node:path";

export type PrefixCsvRow = {
  category: string;
  prefix: string;
  itemCount: number;
  exampleCode: string;
};

/** Parse `prisma/data/category-prefixes.csv` (header + rows). */
export function loadPrefixCsv(
  filePath = path.join(process.cwd(), "prisma/data/category-prefixes.csv"),
): PrefixCsvRow[] {
  const text = readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const rows: PrefixCsvRow[] = [];
  for (const line of lines.slice(1)) {
    const parts = splitCsvLine(line);
    if (parts.length < 2) continue;
    const [category, prefix, itemCountRaw = "0", exampleCode = ""] = parts;
    rows.push({
      category: category.trim(),
      prefix: prefix.trim().toUpperCase(),
      itemCount: Number(itemCountRaw) || 0,
      exampleCode: exampleCode.trim(),
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}
