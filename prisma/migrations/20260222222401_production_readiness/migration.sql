-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "rating" SET DEFAULT 1200;

-- CreateIndex
CREATE INDEX "Attempt_playerId_createdAt_idx" ON "Attempt"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "Player_lastActiveAt_idx" ON "Player"("lastActiveAt");
