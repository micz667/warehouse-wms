-- AlterTable
ALTER TABLE "Location" ADD COLUMN "isRenovation" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Location_isRenovation_idx" ON "Location"("isRenovation");
