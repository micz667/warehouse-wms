import "dotenv/config";
import { encode } from "next-auth/jwt";
import type { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { createCatalogItem } from "../src/server/catalog/create-catalog-item";
import { createLocation } from "../src/server/locations/create-location";

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
      id: `prove-st-${role}`,
      sub: `prove-st-${role}`,
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
  const magCookie = await sessionCookie("magazynier", "mag@local");
  const archCookie = await sessionCookie("architekt", "arch@local");

  const item = await createCatalogItem(prisma, {
    name: `HTTP item ${suffix}`,
    category: "Test",
    unit: "szt",
  });
  if (!item.ok) throw new Error(item.message);

  const loc = await createLocation(prisma, {
    code: `HST-${suffix}`,
    label: `HTTP loc ${suffix}`,
  });
  if (!loc.ok) throw new Error(loc.message);

  const anon = await fetch(`${base}/api/stocktakes`, { method: "POST" });
  if (anon.status !== 401) {
    throw new Error(`expected 401 without session, got ${anon.status}`);
  }

  const arch = await fetch(`${base}/api/stocktakes`, {
    method: "POST",
    headers: {
      cookie: archCookie,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  if (arch.status !== 403) {
    throw new Error(`expected 403 for architekt write, got ${arch.status}`);
  }

  const created = await fetch(`${base}/api/stocktakes`, {
    method: "POST",
    headers: {
      cookie: magCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note: `HTTP ${suffix}` }),
  });
  if (created.status !== 201) {
    throw new Error(`expected 201 create, got ${created.status}`);
  }
  const createdBody = (await created.json()) as { session: { id: string } };
  const id = createdBody.session.id;

  const start = await fetch(`${base}/api/stocktakes/${id}/start`, {
    method: "POST",
    headers: { cookie: magCookie },
  });
  if (start.status !== 200) {
    throw new Error(`expected 200 start, got ${start.status}`);
  }

  const line = await fetch(`${base}/api/stocktakes/${id}/lines`, {
    method: "POST",
    headers: {
      cookie: magCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      catalogItemId: item.item.id,
      locationId: loc.location.id,
      countedQty: 7,
    }),
  });
  if (line.status !== 201) {
    const t = await line.text();
    throw new Error(`expected 201 line, got ${line.status}: ${t}`);
  }

  const approve = await fetch(`${base}/api/stocktakes/${id}/approve`, {
    method: "POST",
    headers: { cookie: magCookie },
  });
  if (approve.status !== 200) {
    const t = await approve.text();
    throw new Error(`expected 200 approve, got ${approve.status}: ${t}`);
  }

  const re = await fetch(`${base}/api/stocktakes/${id}/approve`, {
    method: "POST",
    headers: { cookie: magCookie },
  });
  if (re.status !== 409) {
    throw new Error(`expected 409 re-approve, got ${re.status}`);
  }

  const stock = await fetch(`${base}/api/stock`, {
    headers: { cookie: magCookie },
  });
  if (stock.status !== 200) {
    throw new Error(`expected 200 stock, got ${stock.status}`);
  }
  const stockBody = (await stock.json()) as {
    balances: { catalogItemId: string; locationId: string; qty: string }[];
  };
  const match = stockBody.balances.find(
    (b) =>
      b.catalogItemId === item.item.id && b.locationId === loc.location.id,
  );
  if (!match || match.qty !== "7") {
    throw new Error(`stock balance missing or wrong: ${JSON.stringify(match)}`);
  }

  const page = await fetch(`${base}/stany`, {
    headers: { cookie: magCookie },
    redirect: "manual",
  });
  if (page.status !== 200) {
    throw new Error(`expected 200 /stany, got ${page.status}`);
  }

  console.log(
    "prove-stocktake-http: ok (401/403/201, approve, re-approve 409, stock UI)",
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
