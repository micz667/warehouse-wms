import type { CafeIssueStatus } from "@prisma/client";

export const CAFE_ISSUE_STATUS_LABEL_PL: Record<CafeIssueStatus, string> = {
  prepared: "Przygotowane / w drodze",
  received: "Odebrane / podpisane",
};
