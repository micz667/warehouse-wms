/**
 * Import the warehouse-poc product catalog into CatalogItem (idempotent).
 *
 * Source: a JSON export of the POC SQLite DB (`--source x.json`), or the
 * SQLite file itself (`--from-db x.db`, needs the `sqlite3` CLI; the export
 * JSON is written next to it). Keep both under the gitignored `.import/`.
 *
 * Default is DRY-RUN (no writes). Pass `--apply` to write.
 *
 *   npm run import:poc-catalog -- --from-db .import/poc/data/warehouse.db
 *   npm run import:poc-catalog -- --source .import/poc/poc-export.json --apply
 *   ... --photos-dir .import/poc/uploads   (optional: copy first photo per item
 *        into storage/catalog/ when the WMS item has no photo yet)
 *
 * Identity: SKU = `POC-<poc item id>`; barcode = deterministic Code128 value
 * `WMS` + 12 hex of sha256(poc id) — same shape as generated WMS barcodes.
 * Re-runs match by SKU (then barcode) and only update name/category/unit/
 * description when they differ. Barcode is never rewritten; photo only set
 * when empty.
 *
 * Stock is NOT imported. POC quantities/locations are written to
 * `<source dir>/poc-opening-hints.csv` to plan the opening stocktake (F005).
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { catalogPhotoDir } from "../src/server/catalog/save-catalog-photo";

type PocCategory = { id: string; name: string; parentId: string | null };
type PocItem = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  quantity: number;
  condition: string;
  locationNote: string | null;
  locations: string;
  attributes: string;
  categoryId: string | null;
};
type PocExport = {
  exportedAt: string;
  categories: PocCategory[];
  items: PocItem[];
  tags: { itemId: string; name: string }[];
  photos: { itemId: string; path: string; sortOrder: number }[];
};

const ITEM_SQL = `select id, name, description, notes, quantity, condition, locationNote, locations, attributes, categoryId from Item order by createdAt`;
const CATEGORY_SQL = `select id, name, parentId from Category`;
const TAG_SQL = `select it.itemId as itemId, t.name as name from ItemTag it join Tag t on t.id = it.tagId order by t.name`;
const PHOTO_SQL = `select itemId, path, sortOrder from ItemPhoto order by itemId, sortOrder, createdAt`;

const CONDITION_PL: Record<string, string> = {
  nowy: "nowy",
  dobry: "dobry",
  zuzyty: "zużyty",
  do_naprawy: "do naprawy",
  niekompletny: "niekompletny",
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function sqliteJson<T>(dbPath: string, sql: string): T[] {
  const out = execFileSync("sqlite3", ["-readonly", "-json", dbPath, sql], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  }).trim();
  return out ? (JSON.parse(out) as T[]) : [];
}

async function loadExport(): Promise<{ data: PocExport; dir: string }> {
  const fromDb = arg("--from-db");
  const source = arg("--source");
  if (fromDb) {
    const data: PocExport = {
      exportedAt: new Date().toISOString(),
      categories: sqliteJson(fromDb, CATEGORY_SQL),
      items: sqliteJson(fromDb, ITEM_SQL),
      tags: sqliteJson(fromDb, TAG_SQL),
      photos: sqliteJson(fromDb, PHOTO_SQL),
    };
    const dir = path.dirname(path.resolve(fromDb));
    const jsonPath = path.join(dir, "poc-export.json");
    await writeFile(jsonPath, JSON.stringify(data, null, 1));
    console.log(`Export JSON written: ${jsonPath}`);
    return { data, dir };
  }
  if (source) {
    const data = JSON.parse(await readFile(source, "utf8")) as PocExport;
    return { data, dir: path.dirname(path.resolve(source)) };
  }
  throw new Error("Pass --from-db <warehouse.db> or --source <poc-export.json>");
}

export function pocSku(pocId: string): string {
  return `POC-${pocId}`;
}

export function pocBarcode(pocId: string): string {
  const hex = createHash("sha256").update(`warehouse-poc:${pocId}`).digest("hex");
  return `WMS${hex.slice(0, 12).toUpperCase()}`;
}

function categoryPath(cats: Map<string, PocCategory>, id: string | null): string {
  const parts: string[] = [];
  let cur = id ? cats.get(id) : undefined;
  let guard = 0;
  while (cur && guard++ < 10) {
    parts.unshift(cur.name.trim());
    cur = cur.parentId ? cats.get(cur.parentId) : undefined;
  }
  return parts.length ? parts.join(" / ") : "Bez kategorii";
}

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function buildDescription(item: PocItem, tags: string[]): string | null {
  const lines: string[] = [];
  if (item.description?.trim()) lines.push(item.description.trim());
  if (item.notes?.trim()) lines.push(item.notes.trim());
  lines.push(`Stan (POC): ${CONDITION_PL[item.condition] ?? item.condition}`);
  const attrs = parseJson<Record<string, unknown>>(item.attributes, {});
  const dims = ["lengthCm", "widthCm", "heightCm"]
    .map((k) => attrs[k])
    .filter((v) => v !== undefined && v !== null && v !== "");
  if (dims.length) lines.push(`Wymiary: ${dims.join(" × ")} cm`);
  const otherAttrs = Object.entries(attrs).filter(
    ([k, v]) => !["lengthCm", "widthCm", "heightCm"].includes(k) && v !== "" && v != null,
  );
  if (otherAttrs.length) {
    lines.push(otherAttrs.map(([k, v]) => `${k}: ${String(v)}`).join(", "));
  }
  if (tags.length) lines.push(`Tagi: ${tags.join(", ")}`);
  return lines.join("\n");
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const photosDir = arg("--photos-dir");
  const { data, dir } = await loadExport();

  const cats = new Map(data.categories.map((c) => [c.id, c]));
  const tagsByItem = new Map<string, string[]>();
  for (const t of data.tags) {
    tagsByItem.set(t.itemId, [...(tagsByItem.get(t.itemId) ?? []), t.name]);
  }
  const firstPhoto = new Map<string, string>();
  for (const p of data.photos) if (!firstPhoto.has(p.itemId)) firstPhoto.set(p.itemId, p.path);

  const stats = {
    source: data.items.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    photosSet: 0,
    photosMissing: 0,
  };
  const skippedReasons: string[] = [];
  const hints: string[] = [
    ["sku", "barcode", "name", "poc_qty", "poc_condition", "poc_locations"].join(";"),
  ];

  if (photosDir && apply) await mkdir(catalogPhotoDir(), { recursive: true });

  for (const item of data.items) {
    const name = item.name?.trim();
    if (!name) {
      stats.skipped++;
      skippedReasons.push(`${item.id}: empty name`);
      continue;
    }
    const sku = pocSku(item.id);
    const barcode = pocBarcode(item.id);
    const tags = tagsByItem.get(item.id) ?? [];
    let category = categoryPath(cats, item.categoryId);
    if (tags.length) category = `${category}, ${tags.join(", ")}`;
    const fields = {
      name: name.slice(0, 200),
      category,
      unit: "szt",
      description: buildDescription(item, tags),
    };

    const locs = parseJson<{ note?: string; qty?: number }[]>(item.locations, []);
    hints.push(
      [
        sku,
        barcode,
        name,
        item.quantity,
        item.condition,
        locs.map((l) => `${l.note ?? "?"}×${l.qty ?? "?"}`).join(" | ") ||
          (item.locationNote ?? ""),
      ]
        .map(csvCell)
        .join(";"),
    );

    let existing = await prisma.catalogItem.findUnique({ where: { sku } });
    if (!existing) {
      const byBarcode = await prisma.catalogItem.findUnique({ where: { barcode } });
      if (byBarcode) {
        if (byBarcode.sku !== sku) {
          stats.skipped++;
          skippedReasons.push(`${item.id}: barcode ${barcode} used by SKU ${byBarcode.sku}`);
          continue;
        }
        existing = byBarcode;
      }
    }

    let photoPath: string | null | undefined;
    const pocPhoto = firstPhoto.get(item.id);
    if (photosDir && pocPhoto && !existing?.photoPath) {
      const file = path.basename(pocPhoto);
      const ext = path.extname(file).toLowerCase();
      const src = path.join(photosDir, file);
      const ok = await stat(src).then(
        (s) => s.isFile() && s.size > 0 && s.size <= 5 * 1024 * 1024,
        () => false,
      );
      if (ok && [".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        const target = `poc-${item.id}${ext}`;
        if (apply) await copyFile(src, path.join(catalogPhotoDir(), target));
        photoPath = `/uploads/catalog/${target}`;
        stats.photosSet++;
      } else {
        stats.photosMissing++;
      }
    }

    if (!existing) {
      stats.created++;
      if (apply) {
        await prisma.catalogItem.create({
          data: { sku, barcode, ...fields, photoPath: photoPath ?? null },
        });
      }
      continue;
    }

    const changed =
      existing.name !== fields.name ||
      existing.category !== fields.category ||
      existing.unit !== fields.unit ||
      (existing.description ?? null) !== fields.description ||
      photoPath !== undefined;
    if (!changed) {
      stats.unchanged++;
      continue;
    }
    stats.updated++;
    if (apply) {
      await prisma.catalogItem.update({
        where: { id: existing.id },
        data: { ...fields, ...(photoPath !== undefined ? { photoPath } : {}) },
      });
    }
  }

  const hintsPath = path.join(dir, "poc-opening-hints.csv");
  await writeFile(hintsPath, hints.join("\n") + "\n");

  console.log(apply ? "MODE: APPLY (writes done)" : "MODE: DRY-RUN (no writes)");
  console.log(JSON.stringify(stats, null, 2));
  if (skippedReasons.length) console.log("Skipped:\n  " + skippedReasons.join("\n  "));
  console.log(`Opening-count hints (POC qty/locations, NOT imported): ${hintsPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
