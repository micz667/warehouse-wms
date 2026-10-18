import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { ensureCategoryPrefixesFromCsv } from "../src/server/category-prefixes/ensure-prefixes";

const prisma = new PrismaClient();

/**
 * Seed local admin + category-prefix registry (F020).
 * Default: create-if-missing only — never overwrite an existing passwordHash.
 * Explicit reset: set SEED_ADMIN_RESET=1 (or "true") to replace the password
 * from SEED_ADMIN_PASSWORD. Role/name are still refreshed on reset.
 */
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me";
  const reset =
    process.env.SEED_ADMIN_RESET === "1" ||
    process.env.SEED_ADMIN_RESET === "true";

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && !reset) {
    // Keep passwordHash; optionally ensure role stays admin for local ops.
    if (existing.role !== Role.admin) {
      await prisma.user.update({
        where: { email },
        data: { role: Role.admin, name: existing.name ?? "Administrator" },
      });
    }
  } else {
    const passwordHash = await hash(password, 12);

    if (existing && reset) {
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: Role.admin,
          name: "Administrator",
        },
      });
    } else if (!existing) {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: Role.admin,
          name: "Administrator",
        },
      });
    }
  }

  const prefixes = await ensureCategoryPrefixesFromCsv(prisma);
  console.log(`category prefixes upserted: ${prefixes.upserted}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
