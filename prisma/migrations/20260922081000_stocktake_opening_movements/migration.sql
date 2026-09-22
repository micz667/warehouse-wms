-- CreateEnum
CREATE TYPE "StocktakeStatus" AS ENUM ('draft', 'counting', 'approved');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('opening');

-- CreateTable
CREATE TABLE "StocktakeSession" (
    "id" TEXT NOT NULL,
    "status" "StocktakeStatus" NOT NULL DEFAULT 'draft',
    "note" TEXT,
    "createdById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StocktakeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StocktakeLine" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "countedQty" DECIMAL(18,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StocktakeLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "qty" DECIMAL(18,3) NOT NULL,
    "stocktakeSessionId" TEXT,
    "stocktakeLineId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StocktakeSession_status_idx" ON "StocktakeSession"("status");

-- CreateIndex
CREATE INDEX "StocktakeLine_sessionId_idx" ON "StocktakeLine"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StocktakeLine_sessionId_catalogItemId_locationId_key" ON "StocktakeLine"("sessionId", "catalogItemId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_stocktakeLineId_key" ON "Movement"("stocktakeLineId");

-- CreateIndex
CREATE INDEX "Movement_catalogItemId_locationId_idx" ON "Movement"("catalogItemId", "locationId");

-- CreateIndex
CREATE INDEX "Movement_stocktakeSessionId_idx" ON "Movement"("stocktakeSessionId");

-- AddForeignKey
ALTER TABLE "StocktakeSession" ADD CONSTRAINT "StocktakeSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StocktakeLine" ADD CONSTRAINT "StocktakeLine_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StocktakeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StocktakeLine" ADD CONSTRAINT "StocktakeLine_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StocktakeLine" ADD CONSTRAINT "StocktakeLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_stocktakeSessionId_fkey" FOREIGN KEY ("stocktakeSessionId") REFERENCES "StocktakeSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_stocktakeLineId_fkey" FOREIGN KEY ("stocktakeLineId") REFERENCES "StocktakeLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
