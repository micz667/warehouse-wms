import type { CafeIssueStatus, PrismaClient } from "@prisma/client";

export type ListCafeIssuesInput = {
  statuses?: CafeIssueStatus[];
  take?: number;
};

/**
 * List cafe issue documents (default: prepared / in-transit).
 */
export async function listCafeIssues(
  db: PrismaClient,
  input: ListCafeIssuesInput = {},
) {
  const statuses = input.statuses?.length
    ? input.statuses
    : (["prepared"] as CafeIssueStatus[]);
  const take = Math.min(Math.max(input.take ?? 50, 1), 200);

  return db.cafeIssue.findMany({
    where: { status: { in: statuses } },
    orderBy: { preparedAt: "desc" },
    take,
    include: {
      cafeLocation: {
        select: { id: true, code: true, label: true },
      },
      _count: { select: { lines: true } },
    },
  });
}
