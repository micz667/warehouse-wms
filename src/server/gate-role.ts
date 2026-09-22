import type { Role } from "@prisma/client";

export type RoleGateResult =
  | { ok: true; role: Role }
  | { ok: false; status: 401 | 403 };

/** Pure role gate: missing role → 401, wrong role → 403. */
export function gateRole(
  role: Role | null | undefined,
  allowed: readonly Role[],
): RoleGateResult {
  if (role == null) {
    return { ok: false, status: 401 };
  }
  if (!allowed.includes(role)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, role };
}
