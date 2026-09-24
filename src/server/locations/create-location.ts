import type { Location, PrismaClient } from "@prisma/client";
import { normalizeLocationCode } from "./normalize-location-code";

export type CreateLocationInput = {
  code: string;
  label: string;
  isRenovation?: boolean;
};

export type CreateLocationResult =
  | { ok: true; location: Location }
  | {
      ok: false;
      error: "validation" | "code_taken";
      message: string;
    };

function trimRequired(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Admin create — unique code is the scannable target for F007 movements. */
export async function createLocation(
  db: PrismaClient,
  input: CreateLocationInput,
): Promise<CreateLocationResult> {
  const code = normalizeLocationCode(input.code);
  const label = trimRequired(input.label);

  if (!code) {
    return {
      ok: false,
      error: "validation",
      message:
        "Kod lokalizacji jest wymagany (litery, cyfry, ., _, -; max 64 znaki)",
    };
  }
  if (!label) {
    return {
      ok: false,
      error: "validation",
      message: "Nazwa lokalizacji jest wymagana",
    };
  }

  const existing = await db.location.findUnique({ where: { code } });
  if (existing) {
    return {
      ok: false,
      error: "code_taken",
      message: "Kod lokalizacji już istnieje",
    };
  }

  try {
    const location = await db.location.create({
      data: {
        code,
        label,
        isRenovation: Boolean(input.isRenovation),
      },
    });
    return { ok: true, location };
  } catch {
    return {
      ok: false,
      error: "code_taken",
      message: "Kod lokalizacji już istnieje",
    };
  }
}
