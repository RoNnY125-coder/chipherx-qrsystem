-- AlterTable Team
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable Participant
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Participant" ALTER COLUMN "externalUserId" DROP NOT NULL;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "qrTokenHash" TEXT;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "qrTokenEncrypted" TEXT;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Participant_email_key" ON "Participant"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Participant_qrTokenHash_key" ON "Participant"("qrTokenHash");

-- CreateTable Attendance
CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_participantId_key" ON "Attendance"("participantId");
CREATE INDEX IF NOT EXISTS "Attendance_participantId_idx" ON "Attendance"("participantId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_participantId_fkey'
    ) THEN
        ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
