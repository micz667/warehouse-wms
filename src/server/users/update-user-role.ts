import type { PrismaClient, Role, User } from "@prisma/client";
import { isValidRole } from "./roles";

export type UpdateUserRoleInput = {
  userId: string;
  role: Role;
};

export type UpdateUserRoleResult =
  | {
      ok: true;
      user: Pick<User, "id" | "email" | "name" | "role" | "updatedAt">;
    }
  | {
      ok: false;
      error: "validation" | "not_found";
      message: string;
    };

/** Admin role change — does not touch password. */
export async function updateUserRole(
  db: PrismaClient,
  input: UpdateUserRoleInput,
): Promise<UpdateUserRoleResult> {
  const userId =
    typeof input.userId === "string" ? input.userId.trim() : "";
  if (!userId) {
    return {
      ok: false,
      error: "validation",
      message: "Identyfikator użytkownika jest wymagany",
    };
  }
  if (!isValidRole(input.role)) {
    return {
      ok: false,
      error: "validation",
      message: "Nieprawidłowa rola",
    };
  }

  const existing = await db.user.findUnique({ where: { id: userId } });
  if (!existing) {
    return {
      ok: false,
      error: "not_found",
      message: "Nie znaleziono użytkownika",
    };
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { role: input.role },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      updatedAt: true,
    },
  });

  return { ok: true, user };
}
