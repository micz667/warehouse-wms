-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "photoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_sku_key" ON "CatalogItem"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_barcode_key" ON "CatalogItem"("barcode");

-- CreateIndex
CREATE INDEX "CatalogItem_name_idx" ON "CatalogItem"("name");

-- CreateIndex
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem"("category");
