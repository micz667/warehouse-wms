import "dotenv/config";
import { encode } from "next-auth/jwt";
import type { Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { createLocation } from "../src/server/locations/create-location";
import { findLocationByCode } from "../src/server/locations/find-location-by-code";
import { listLocations } from "../src/server/locations/list-locations";

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
      id: `prove-loc-${role}`,
      sub: `prove-loc-${role}`,
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
  const code = `LOC-${suffix}`;
  const adminCookie = await sessionCookie("admin", "admin@local");
  const magCookie = await sessionCookie("magazynier", "mag@local");

  const created = await createLocation(prisma, {
    code,
    label: `Lokalizacja testowa ${suffix}`,
  });
  if (!created.ok) {
    throw new Error(`create failed: ${created.message}`);
  }

  const listed = await listLocations(prisma, code);
  if (!listed.some((loc) => loc.id === created.location.id)) {
    throw new Error("created location missing from searchable list");
  }

  const byCode = await findLocationByCode(prisma, code.toLowerCase());
  if (!byCode || byCode.id !== created.location.id) {
    throw new Error("findLocationByCode failed for normalized code");
  }

  const dup = await createLocation(prisma, {
    code: code.toLowerCase(),
    label: "Duplikat kodu",
  });
  if (dup.ok || dup.error !== "code_taken") {
    throw new Error("expected code_taken on duplicate location code");
  }

  const anon = await fetch(`${base}/api/locations`, { method: "POST" });
  if (anon.status !== 401) {
    throw new Error(`expected 401 without session, got ${anon.status}`);
  }

  const mag = await fetch(`${base}/api/locations`, {
    method: "POST",
    headers: {
      cookie: magCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: `MAG-${suffix}`,
      label: "Mag blocked",
    }),
  });
  if (mag.status !== 403) {
    throw new Error(`expected 403 for magazynier write, got ${mag.status}`);
  }

  const admin = await fetch(`${base}/api/locations`, {
    method: "POST",
    headers: {
      cookie: adminCookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: `ADM-${suffix}`,
      label: `Admin ${suffix}`,
    }),
  });
  if (admin.status !== 201) {
    const body = await admin.text();
    throw new Error(`expected 201 for admin, got ${admin.status}: ${body}`);
  }

  const adminBody = (await admin.json()) as {
    location: { id: string; code: string };
  };

  const lookup = await fetch(
    `${base}/api/locations/by-code/${encodeURIComponent(adminBody.location.code)}`,
    { headers: { cookie: magCookie } },
  );
  if (lookup.status !== 200) {
    throw new Error(`expected 200 by-code for magazynier, got ${lookup.status}`);
  }

  const picker = await fetch(`${base}/lokalizacje/wybierz`, {
    headers: { cookie: magCookie },
    redirect: "manual",
  });
  if (picker.status !== 200) {
    throw new Error(`expected 200 stub picker page, got ${picker.status}`);
  }
  const pickerHtml = await picker.text();
  if (!pickerHtml.includes("Wybierz lokalizację")) {
    throw new Error("stub picker page missing Polish heading");
  }

  const label = await fetch(
    `${base}/lokalizacje/${adminBody.location.id}/etykieta`,
    { headers: { cookie: adminCookie }, redirect: "manual" },
  );
  if (label.status !== 200) {
    throw new Error(`expected 200 label page, got ${label.status}`);
  }
  const html = await label.text();
  if (!html.includes(adminBody.location.code)) {
    throw new Error("label page missing location code");
  }

  console.log(
    "prove-locations-http: ok (unique code, 401/403/201, by-code, picker, label)",
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
