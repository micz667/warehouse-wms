import type { Location, PrismaClient } from "@prisma/client";
import { normalizeLocationCode } from "./normalize-location-code";

export type UpdateLocationInput = {
  code?: string;
  label?: string;
};

export type UpdateLocationResult =
  | { ok: true; location: Location }
  | {
      ok: false;
      error: "not_found" | "validation" | "code_taken";
      message: string;
    };

function trimOptional(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Updates code and/or label. Code stays unique; empty values rejected. */
export async function updateLocation(
  db: PrismaClient,
  id: string,
  input: UpdateLocationInput,
): Promise<UpdateLocationResult> {
  const existing = await db.location.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, error: "not_found", message: "Lokalizacja nie istnieje" };
  }

  const data: { code?: string; label?: string } = {};

  if (input.code !== undefined) {
    const code = normalizeLocationCode(input.code);
    if (!code) {
      return {
        ok: false,
        error: "validation",
        message:
          "Kod lokalizacji jest wymagany (litery, cyfry, ., _, -; max 64 znaki)",
      };
    }
    if (code !== existing.code) {
      const taken = await db.location.findUnique({ where: { code } });
      if (taken) {
        return {
          ok: false,
          error: "code_taken",
          message: "Kod lokalizacji już istnieje",
        };
      }
      data.code = code;
    }
  }

  if (input.label !== undefined) {
    const label = trimOptional(input.label);
    if (!label) {
      return {
        ok: false,
        error: "validation",
        message: "Nazwa lokalizacji nie może być pusta",
      };
    }
    data.label = label;
  }

  try {
    const location = await db.location.update({
      where: { id },
      data,
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
