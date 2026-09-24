-- AlterTable
ALTER TABLE "CafeIssue" ADD COLUMN     "signatureSkipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emergencyNote" TEXT;

-- CreateIndex
CREATE INDEX "CafeIssue_signatureSkipped_idx" ON "CafeIssue"("signatureSkipped");
