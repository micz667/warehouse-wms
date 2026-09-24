-- CreateEnum: opening vs inventory stocktake sessions (F017)
CREATE TYPE "StocktakeKind" AS ENUM ('opening', 'inventory');

-- AlterTable: default opening preserves F005 sessions
ALTER TABLE "StocktakeSession" ADD COLUMN "kind" "StocktakeKind" NOT NULL DEFAULT 'opening';

-- CreateIndex
CREATE INDEX "StocktakeSession_kind_idx" ON "StocktakeSession"("kind");
