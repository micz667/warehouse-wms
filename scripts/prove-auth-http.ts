import "dotenv/config";
import { encode } from "next-auth/jwt";
import type { Role } from "@prisma/client";

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
      id: `prove-${role}`,
      sub: `prove-${role}`,
      email,
      name: email,
      role,
    },
    secret,
    salt: "authjs.session-token",
  });
  return `authjs.session-token=${token}`;
}

async function getStatus(
  path: string,
  cookie?: string,
): Promise<{ status: number; body: string }> {
  const res = await fetch(`${base}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  const body = await res.text();
  return { status: res.status, body };
}

async function main() {
  const home = await getStatus("/");
  if (home.status !== 307 && home.status !== 302) {
    throw new Error(`expected redirect from /, got ${home.status}`);
  }

  const anon = await getStatus("/api/sample/admin-only");
  if (anon.status !== 401) {
    throw new Error(`expected 401 without session, got ${anon.status}: ${anon.body}`);
  }

  const mag = await getStatus(
    "/api/sample/admin-only",
    await sessionCookie("magazynier", "mag@local"),
  );
  if (mag.status !== 403) {
    throw new Error(`expected 403 for magazynier, got ${mag.status}: ${mag.body}`);
  }

  const admin = await getStatus(
    "/api/sample/admin-only",
    await sessionCookie("admin", "admin@local"),
  );
  if (admin.status !== 200) {
    throw new Error(`expected 200 for admin, got ${admin.status}: ${admin.body}`);
  }

  console.log("prove-auth-http: ok (redirect, 401, 403, 200)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
