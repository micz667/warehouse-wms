import "dotenv/config";
import { encode } from "next-auth/jwt";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { listCatalogItems } from "../src/server/catalog/list-catalog-items";

const base = process.env.PROVE_BASE_URL ?? "http://localhost:3000";
const rawSecret = process.env.AUTH_SECRET;

if (!rawSecret) {
  console.error("AUTH_SECRET missing");
  process.exit(1);
}

const secret: string = rawSecret;

async function sessionCookie(role: Role, email: string): Promise<string> {
  const token = await encode({
    token: {
      id: `prove-catalog-${role}`,
      sub: `prove-catalog-${role}`,
      email,
      name: email,
      role,
    },
    secret,
    salt: "authjs.session-token",
  });
  return `authjs.session-token=${token}`;
}

async function main() {
  const suffix = Date.now().toString(36);
  const sku = `PROVE-${suffix}`;
  const magCookie = await sessionCookie("magazynier", "mag@local");

  const created = await createCatalogItem(prisma, {
    sku,
    name: `Pozycja testowa ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  if (!created.ok) {
    throw new Error(`create failed: ${created.message}`);
  }

  const listed = await listCatalogItems(prisma, sku);
  if (!listed.some((item) => item.id === created.item.id)) {
    throw new Error("created item missing from searchable list");
  }

  const dup = await createCatalogItem(prisma, {
    sku: `OTHER-${suffix}`,
    name: "Duplikat kodu",
    category: "Test",
    unit: "szt",
    barcode: created.item.barcode,
  });
  if (dup.ok || dup.error !== "barcode_taken") {
    throw new Error("expected barcode_taken on duplicate barcode");
  }

  const anon = await fetch(`${base}/api/catalog`, { method: "POST" });
  if (anon.status !== 401) {
    throw new Error(`expected 401 without session, got ${anon.status}`);
  }

  const arch = await fetch(`${base}/api/catalog`, {
    method: "POST",
    headers: {
      cookie: await sessionCookie("architekt", "arch@local"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sku: `ARCH-${suffix}`,
      name: "Arch blocked",
      category: "Test",
      unit: "szt",
    }),
  });
  if (arch.status !== 403) {
    throw new Error(`expected 403 for architekt write, got ${arch.status}`);
  }

  const mag = await fetch(`${base}/api/catalog`, {
    method: "POST",
    headers: {
      cookie: magCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sku: `MAG-${suffix}`,
      name: `Magazynier ${suffix}`,
      category: "Test",
      unit: "szt",
    }),
  });
  if (mag.status !== 201) {
    const body = await mag.text();
    throw new Error(`expected 201 for magazynier, got ${mag.status}: ${body}`);
  }

  const magBody = (await mag.json()) as { item: { id: string; barcode: string } };
  const label = await fetch(`${base}/katalog/${magBody.item.id}/etykieta`, {
    headers: { cookie: magCookie },
    redirect: "manual",
  });
  if (label.status !== 200) {
    throw new Error(`expected 200 label page, got ${label.status}`);
  }
  const html = await label.text();
  if (!html.includes(magBody.item.barcode)) {
    throw new Error("label page missing barcode value");
  }

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const form = new FormData();
  form.set("photo", new Blob([png], { type: "image/png" }), "dot.png");
  const photoRes = await fetch(`${base}/api/catalog/${magBody.item.id}/photo`, {
    method: "POST",
    headers: { cookie: magCookie },
    body: form,
  });
  const photoBody = (await photoRes.json()) as {
    item?: { photoPath: string | null };
    error?: string;
  };
  if (photoRes.status !== 200 || !photoBody.item?.photoPath) {
    throw new Error(
      `expected photo 200, got ${photoRes.status}: ${JSON.stringify(photoBody)}`,
    );
  }
  const disk = path.join(
    "storage",
    "catalog",
    path.basename(photoBody.item.photoPath),
  );
  if (!existsSync(disk)) {
    throw new Error(`photo missing on disk: ${disk}`);
  }
  const itemPage = await fetch(`${base}/katalog/${magBody.item.id}`, {
    headers: { cookie: magCookie },
  });
  const itemHtml = await itemPage.text();
  if (!itemHtml.includes(photoBody.item.photoPath)) {
    throw new Error("item page missing photoPath");
  }
  const img = await fetch(`${base}${photoBody.item.photoPath}`);
  if (img.status !== 200) {
    throw new Error(`expected photo URL 200, got ${img.status}`);
  }

  console.log(
    "prove-catalog-http: ok (persist+search, unique barcode, 401/403/201, label, photo)",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
