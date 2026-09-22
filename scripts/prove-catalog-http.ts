import "dotenv/config";
import { encode } from "next-auth/jwt";
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
      cookie: await sessionCookie("magazynier", "mag@local"),
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
    headers: { cookie: await sessionCookie("magazynier", "mag@local") },
    redirect: "manual",
  });
  if (label.status !== 200) {
    throw new Error(`expected 200 label page, got ${label.status}`);
  }
  const html = await label.text();
  if (!html.includes(magBody.item.barcode)) {
    throw new Error("label page missing barcode value");
  }

  console.log(
    "prove-catalog-http: ok (persist+search, unique barcode, 401/403/201, label)",
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
