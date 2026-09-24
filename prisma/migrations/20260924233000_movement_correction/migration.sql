-- AlterEnum: storno / opposite movement kind (F015)
ALTER TYPE "MovementType" ADD VALUE 'correction';

-- AlterTable: link correction row to the mistaken movement (append-only)
ALTER TABLE "Movement" ADD COLUMN "correctsMovementId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Movement_correctsMovementId_key" ON "Movement"("correctsMovementId");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_correctsMovementId_fkey" FOREIGN KEY ("correctsMovementId") REFERENCES "Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
