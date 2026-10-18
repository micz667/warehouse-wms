import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { detectImageMagic } from "./detect-image-magic";

const EXT_BY_TYPE = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

export type SaveCatalogPhotoResult =
  | { ok: true; photoPath: string }
  | { ok: false; message: string };

/** Absolute directory for catalog photos (local/docker; not the Next public/ cache). */
export function catalogPhotoDir(): string {
  return path.join(process.cwd(), "storage", "catalog");
}

/**
 * Stores an optional catalog photo under storage/catalog.
 * Content type is decided by magic bytes, not the browser MIME claim.
 * Returns a URL path served by `/uploads/catalog/[filename]` (auth required).
 */
export async function saveCatalogPhoto(
  itemId: string,
  file: File,
): Promise<SaveCatalogPhotoResult> {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return {
      ok: false,
      message: "Zdjęcie musi mieć do 5 MB",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageMagic(buffer);
  if (!detected) {
    return {
      ok: false,
      message: "Dozwolone formaty: JPEG, PNG, WebP (sprawdzane po zawartości pliku)",
    };
  }

  const ext = EXT_BY_TYPE.get(detected);
  if (!ext) {
    return {
      ok: false,
      message: "Dozwolone formaty: JPEG, PNG, WebP",
    };
  }

  const dir = catalogPhotoDir();
  await mkdir(dir, { recursive: true });

  const filename = `${itemId}-${randomBytes(4).toString("hex")}${ext}`;
  const absolute = path.join(dir, filename);
  await writeFile(absolute, buffer);

  return { ok: true, photoPath: `/uploads/catalog/${filename}` };
}
