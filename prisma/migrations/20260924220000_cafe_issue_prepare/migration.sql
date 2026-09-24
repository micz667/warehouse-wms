-- CreateEnum
CREATE TYPE "CafeIssueStatus" AS ENUM ('prepared');

-- CreateTable
CREATE TABLE "CafeIssue" (
    "id" TEXT NOT NULL,
    "status" "CafeIssueStatus" NOT NULL DEFAULT 'prepared',
    "cafeLocationId" TEXT NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CafeIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CafeIssueLine" (
    "id" TEXT NOT NULL,
    "cafeIssueId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "sourceLocationId" TEXT NOT NULL,
    "qty" DECIMAL(18,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CafeIssueLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CafeIssue_status_idx" ON "CafeIssue"("status");

-- CreateIndex
CREATE INDEX "CafeIssue_preparedAt_idx" ON "CafeIssue"("preparedAt");

-- CreateIndex
CREATE INDEX "CafeIssue_cafeLocationId_idx" ON "CafeIssue"("cafeLocationId");

-- CreateIndex
CREATE INDEX "CafeIssueLine_cafeIssueId_idx" ON "CafeIssueLine"("cafeIssueId");

-- CreateIndex
CREATE UNIQUE INDEX "CafeIssueLine_cafeIssueId_catalogItemId_sourceLocationId_key" ON "CafeIssueLine"("cafeIssueId", "catalogItemId", "sourceLocationId");

-- AddForeignKey
ALTER TABLE "CafeIssue" ADD CONSTRAINT "CafeIssue_cafeLocationId_fkey" FOREIGN KEY ("cafeLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CafeIssue" ADD CONSTRAINT "CafeIssue_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CafeIssueLine" ADD CONSTRAINT "CafeIssueLine_cafeIssueId_fkey" FOREIGN KEY ("cafeIssueId") REFERENCES "CafeIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CafeIssueLine" ADD CONSTRAINT "CafeIssueLine_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CafeIssueLine" ADD CONSTRAINT "CafeIssueLine_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
