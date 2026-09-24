import type { Role } from "@prisma/client";

export const ROLE_LABEL_PL: Record<Role, string> = {
  magazynier: "Magazynier",
  architekt: "Architekt",
  admin: "Administrator",
};

export function shellBlurbForRole(role: Role): string {
  switch (role) {
    case "magazynier":
      return "Hub skanu: Przyjmij / Wydaj / Przenieś / Zwrot / Renowacja / Gdzie leży? / Historia.";
    case "architekt":
      return "Widok architekta: listy zakupów z katalogu.";
    case "admin":
      return "Widok administratora: użytkownicy i historia ruchów.";
  }
}
