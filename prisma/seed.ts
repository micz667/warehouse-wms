import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "change-me";
  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.admin,
      name: "Administrator",
    },
    create: {
      email,
      passwordHash,
      role: Role.admin,
      name: "Administrator",
    },
  });
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
