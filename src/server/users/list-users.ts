import type { PrismaClient, Role } from "@prisma/client";

export type UserListRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
};

/** Admin directory — email, name, role. Never returns passwordHash. */
export async function listUsers(db: PrismaClient): Promise<UserListRow[]> {
  const rows = await db.user.findMany({
    orderBy: [{ email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
  return rows;
}
