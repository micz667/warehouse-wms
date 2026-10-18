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
 * Identity (F020): `sourceRef` = `poc:<poc item id>` (unique). Re-runs match
 * by sourceRef first. SKU and Code128 barcode are the category-prefix code
 * (e.g. KRZ-0042). Codes are immutable — re-runs do not renumber.
 *
 * Deterministic numbering on a fresh DB: items sorted by category path, then
 * name, then POC id; codes allocated in that order after seeding the prefix
 * registry from `prisma/data/category-prefixes.csv`.
 *
 * Stock is NOT imported. POC quantities/locations are written to
 * `<source dir>/poc-opening-hints.csv` to plan the opening stocktake (F005).
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { allocateItemCode } from "../src/server/category-prefixes/allocate-item-code";
import { ensureCategoryPrefixesFromCsv } from "../src/server/category-prefixes/ensure-prefixes";
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
  createdAt?: string;
};
type PocExport = {
  exportedAt: string;
  categories: PocCategory[];
  items: PocItem[];
  tags: { itemId: string; name: string }[];
  photos: { itemId: string; path: string; sortOrder: number }[];
};

const ITEM_SQL = `select id, name, description, notes, quantity, condition, locationNote, locations, attributes, categoryId, createdAt from Item order by createdAt`;
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

export function pocSourceRef(pocId: string): string {
  return `poc:${pocId}`;
}

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
  lines.push(`POC id: ${item.id}`);
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

  if (apply) {
    await ensureCategoryPrefixesFromCsv(prisma);
  }

  const cats = new Map(data.categories.map((c) => [c.id, c]));
  const tagsByItem = new Map<string, string[]>();
  for (const t of data.tags) {
    tagsByItem.set(t.itemId, [...(tagsByItem.get(t.itemId) ?? []), t.name]);
  }
  const firstPhoto = new Map<string, string>();
  for (const p of data.photos) if (!firstPhoto.has(p.itemId)) firstPhoto.set(p.itemId, p.path);

  type Prepared = {
    item: PocItem;
    name: string;
    category: string;
    sourceRef: string;
    description: string | null;
    tags: string[];
  };

  const prepared: Prepared[] = [];
  const skippedReasons: string[] = [];
  for (const item of data.items) {
    const name = item.name?.trim();
    if (!name) {
      skippedReasons.push(`${item.id}: empty name`);
      continue;
    }
    const tags = tagsByItem.get(item.id) ?? [];
    const category = categoryPath(cats, item.categoryId);
    prepared.push({
      item,
      name: name.slice(0, 200),
      category,
      sourceRef: pocSourceRef(item.id),
      description: buildDescription(item, tags),
      tags,
    });
  }

  // Deterministic order → stable codes on a fresh DB.
  prepared.sort((a, b) => {
    const c = a.category.localeCompare(b.category, "pl");
    if (c !== 0) return c;
    const n = a.name.localeCompare(b.name, "pl");
    if (n !== 0) return n;
    return a.item.id.localeCompare(b.item.id);
  });

  const stats = {
    source: data.items.length,
    created: 0,
    updated: 0,
    unchanged: 0,
    skipped: skippedReasons.length,
    photosSet: 0,
    photosMissing: 0,
  };
  const hints: string[] = [
    ["sku", "barcode", "name", "poc_qty", "poc_condition", "poc_locations"].join(";"),
  ];

  if (photosDir && apply) await mkdir(catalogPhotoDir(), { recursive: true });

  for (const row of prepared) {
    const { item, name, category, sourceRef, description } = row;
    const fields = {
      name,
      category,
      unit: "szt",
      description,
    };

    let existing = await prisma.catalogItem.findUnique({ where: { sourceRef } });
    // Legacy import matched POC-<id> SKU / WMS* barcode — still find those.
    if (!existing) {
      existing = await prisma.catalogItem.findUnique({
        where: { sku: `POC-${item.id}` },
      });
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

    let code = existing?.sku ?? existing?.barcode ?? null;
    if (!existing) {
      if (apply) {
        code = await allocateItemCode(prisma, category);
      } else {
        // Dry-run: show planned category; exact number needs live counter.
        code = `(pending:${category})`;
      }
      stats.created++;
      hints.push(
        [
          code,
          code,
          name,
          item.quantity,
          item.condition,
          parseJson<{ note?: string; qty?: number }[]>(item.locations, [])
            .map((l) => `${l.note ?? "?"}×${l.qty ?? "?"}`)
            .join(" | ") || (item.locationNote ?? ""),
        ]
          .map(csvCell)
          .join(";"),
      );
      if (apply && code) {
        await prisma.catalogItem.create({
          data: {
            sku: code,
            barcode: code,
            sourceRef,
            ...fields,
            photoPath: photoPath ?? null,
          },
        });
      }
      continue;
    }

    hints.push(
      [
        existing.sku,
        existing.barcode,
        name,
        item.quantity,
        item.condition,
        parseJson<{ note?: string; qty?: number }[]>(item.locations, [])
          .map((l) => `${l.note ?? "?"}×${l.qty ?? "?"}`)
          .join(" | ") || (item.locationNote ?? ""),
      ]
        .map(csvCell)
        .join(";"),
    );

    const changed =
      existing.name !== fields.name ||
      existing.category !== fields.category ||
      existing.unit !== fields.unit ||
      (existing.description ?? null) !== fields.description ||
      existing.sourceRef !== sourceRef ||
      photoPath !== undefined;
    if (!changed) {
      stats.unchanged++;
      continue;
    }
    stats.updated++;
    if (apply) {
      // Never rewrite sku/barcode — codes are immutable (F020).
      await prisma.catalogItem.update({
        where: { id: existing.id },
        data: {
          ...fields,
          sourceRef,
          ...(photoPath !== undefined ? { photoPath } : {}),
        },
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
