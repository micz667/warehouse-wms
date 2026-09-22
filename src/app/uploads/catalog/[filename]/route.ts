import { readFile } from "node:fs/promises";
import path from "node:path";
import { catalogPhotoDir } from "@/server/catalog/save-catalog-photo";

type RouteContext = { params: Promise<{ filename: string }> };

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Serves catalog photos from storage/catalog (works after upload without restarting next start). */
export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  if (
    !filename ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const absolute = path.join(catalogPhotoDir(), filename);
    const data = await readFile(absolute);
    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
