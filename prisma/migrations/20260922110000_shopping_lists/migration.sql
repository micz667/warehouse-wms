-- CreateEnum
CREATE TYPE "ShoppingListStatus" AS ENUM ('draft', 'submitted', 'done');

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "status" "ShoppingListStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListLine" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "qty" DECIMAL(18,3) NOT NULL,
    "note" TEXT,
    "checkedAt" TIMESTAMP(3),
    "checkedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingList_status_idx" ON "ShoppingList"("status");

-- CreateIndex
CREATE INDEX "ShoppingList_createdAt_idx" ON "ShoppingList"("createdAt");

-- CreateIndex
CREATE INDEX "ShoppingListLine_listId_idx" ON "ShoppingListLine"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListLine_listId_catalogItemId_key" ON "ShoppingListLine"("listId", "catalogItemId");

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListLine" ADD CONSTRAINT "ShoppingListLine_listId_fkey" FOREIGN KEY ("listId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListLine" ADD CONSTRAINT "ShoppingListLine_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListLine" ADD CONSTRAINT "ShoppingListLine_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
