-- AlterTable
ALTER TABLE "Checkpoint" ADD COLUMN "qrTokenEncrypted" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Checkpoint_name_key" ON "Checkpoint"("name");
