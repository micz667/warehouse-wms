import type { Role } from "@prisma/client";

export const ROLE_LABEL_PL: Record<Role, string> = {
  magazynier: "Magazynier",
  architekt: "Architekt",
  admin: "Administrator",
};

export function shellBlurbForRole(role: Role): string {
  switch (role) {
    case "magazynier":
      return "Widok hali: skan przyjęć, przesunięć i wydań.";
    case "architekt":
      return "Widok architekta: listy zakupów (kolejne slice'y).";
    case "admin":
      return "Widok administratora: użytkownicy i historia ruchów.";
  }
}
