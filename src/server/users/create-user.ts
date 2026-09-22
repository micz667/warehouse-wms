import { hash } from "bcryptjs";
import type { PrismaClient, Role, User } from "@prisma/client";
import { isValidRole } from "./roles";

export type CreateUserInput = {
  email: string;
  password: string;
  name?: string | null;
  role: Role;
};

export type CreateUserResult =
  | {
      ok: true;
      user: Pick<User, "id" | "email" | "name" | "role" | "createdAt">;
    }
  | {
      ok: false;
      error: "validation" | "email_taken";
      message: string;
    };

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@") || trimmed.length > 254) return null;
  return trimmed;
}

function trimOptional(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Admin create — local credentials; role assigned at create time. */
export async function createUser(
  db: PrismaClient,
  input: CreateUserInput,
): Promise<CreateUserResult> {
  const email = normalizeEmail(input.email);
  const password =
    typeof input.password === "string" ? input.password : "";
  const name = trimOptional(input.name);
  const role = input.role;

  if (!email) {
    return {
      ok: false,
      error: "validation",
      message: "Email jest wymagany",
    };
  }
  if (password.length < 6) {
    return {
      ok: false,
      error: "validation",
      message: "Hasło musi mieć co najmniej 6 znaków",
    };
  }
  if (!isValidRole(role)) {
    return {
      ok: false,
      error: "validation",
      message: "Nieprawidłowa rola",
    };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      error: "email_taken",
      message: "Użytkownik o tym emailu już istnieje",
    };
  }

  const passwordHash = await hash(password, 12);

  try {
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    return { ok: true, user };
  } catch {
    return {
      ok: false,
      error: "email_taken",
      message: "Użytkownik o tym emailu już istnieje",
    };
  }
}
