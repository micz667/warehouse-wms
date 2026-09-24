import type { CafeIssueStatus } from "@prisma/client";

export const CAFE_ISSUE_STATUS_LABEL_PL: Record<CafeIssueStatus, string> = {
  prepared: "Przygotowane / w drodze",
  received: "Odebrane / podpisane",
};

/** Display label — emergency received docs are not “podpisane”. */
export function cafeIssueStatusLabelPl(doc: {
  status: CafeIssueStatus;
  signatureSkipped?: boolean;
}): string {
  if (doc.status === "received" && doc.signatureSkipped) {
    return "Wydane awaryjnie (bez podpisu)";
  }
  return CAFE_ISSUE_STATUS_LABEL_PL[doc.status];
}
