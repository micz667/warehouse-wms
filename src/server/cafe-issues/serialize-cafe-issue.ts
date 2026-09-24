import type {
  CafeIssue,
  CafeIssueLine,
  CatalogItem,
  Location,
  User,
} from "@prisma/client";

export type CafeIssueLineWithRefs = CafeIssueLine & {
  catalogItem: Pick<
    CatalogItem,
    "id" | "sku" | "name" | "barcode" | "unit"
  >;
  sourceLocation: Pick<Location, "id" | "code" | "label">;
};

export type CafeIssueWithDetails = CafeIssue & {
  cafeLocation: Pick<Location, "id" | "code" | "label">;
  lines: CafeIssueLineWithRefs[];
  signedBy?: Pick<User, "id" | "name" | "email"> | null;
  _count?: { lines: number };
};

/** JSON-safe cafe issue row (Decimal → string). */
export function serializeCafeIssue(doc: CafeIssueWithDetails) {
  return {
    id: doc.id,
    status: doc.status,
    note: doc.note,
    preparedAt: doc.preparedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    createdById: doc.createdById,
    signatureData: doc.signatureData,
    signedAt: doc.signedAt ? doc.signedAt.toISOString() : null,
    signedById: doc.signedById,
    signatureSkipped: doc.signatureSkipped,
    emergencyNote: doc.emergencyNote,
    signedBy: doc.signedBy
      ? {
          id: doc.signedBy.id,
          name: doc.signedBy.name,
          email: doc.signedBy.email,
        }
      : null,
    cafeLocation: doc.cafeLocation,
    lines: doc.lines.map((line) => ({
      id: line.id,
      qty: line.qty.toString(),
      catalogItem: line.catalogItem,
      sourceLocation: line.sourceLocation,
    })),
    lineCount: doc._count?.lines ?? doc.lines.length,
  };
}

export function serializeCafeIssueListRow(
  doc: CafeIssue & {
    cafeLocation: Pick<Location, "id" | "code" | "label">;
    _count: { lines: number };
  },
) {
  return {
    id: doc.id,
    status: doc.status,
    note: doc.note,
    preparedAt: doc.preparedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    signatureSkipped: doc.signatureSkipped,
    cafeLocation: doc.cafeLocation,
    lineCount: doc._count.lines,
  };
}
