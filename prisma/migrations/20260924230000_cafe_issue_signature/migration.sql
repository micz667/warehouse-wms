-- AlterEnum
ALTER TYPE "CafeIssueStatus" ADD VALUE 'received';

-- AlterTable
ALTER TABLE "CafeIssue" ADD COLUMN     "signatureData" TEXT,
ADD COLUMN     "signedAt" TIMESTAMP(3),
ADD COLUMN     "signedById" TEXT;

-- CreateIndex
CREATE INDEX "CafeIssue_signedAt_idx" ON "CafeIssue"("signedAt");

-- AddForeignKey
ALTER TABLE "CafeIssue" ADD CONSTRAINT "CafeIssue_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
