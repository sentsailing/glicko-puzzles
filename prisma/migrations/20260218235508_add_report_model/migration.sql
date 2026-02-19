-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('FORMATTING', 'WRONG_ANSWER', 'OTHER');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "playerId" TEXT,
    "type" "ReportType" NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_problemId_idx" ON "Report"("problemId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
