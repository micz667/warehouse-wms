-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN "externalBarcode" TEXT,
ADD COLUMN "sourceRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_externalBarcode_key" ON "CatalogItem"("externalBarcode");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_sourceRef_key" ON "CatalogItem"("sourceRef");

-- CreateTable
CREATE TABLE "CategoryPrefix" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryPrefix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryPrefix_category_key" ON "CategoryPrefix"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryPrefix_prefix_key" ON "CategoryPrefix"("prefix");

-- CreateIndex
CREATE INDEX "CategoryPrefix_prefix_idx" ON "CategoryPrefix"("prefix");
