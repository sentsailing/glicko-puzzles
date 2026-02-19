-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AnswerType" AS ENUM ('FREE_RESPONSE', 'MULTIPLE_CHOICE');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "firebaseUid" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "ratingDeviation" DOUBLE PRECISION NOT NULL DEFAULT 350,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answerType" "AnswerType" NOT NULL DEFAULT 'FREE_RESPONSE',
    "choices" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "ratingDeviation" DOUBLE PRECISION NOT NULL DEFAULT 350,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0.06,
    "difficulty" "Difficulty" NOT NULL,
    "source" TEXT,
    "sourceNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "ratingBefore" DOUBLE PRECISION NOT NULL,
    "ratingAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_sessionToken_key" ON "Player"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Player_firebaseUid_key" ON "Player"("firebaseUid");

-- CreateIndex
CREATE INDEX "Player_sessionToken_idx" ON "Player"("sessionToken");

-- CreateIndex
CREATE INDEX "Player_firebaseUid_idx" ON "Player"("firebaseUid");

-- CreateIndex
CREATE INDEX "Player_rating_idx" ON "Player"("rating");

-- CreateIndex
CREATE INDEX "Problem_rating_idx" ON "Problem"("rating");

-- CreateIndex
CREATE INDEX "Problem_difficulty_idx" ON "Problem"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Problem_source_sourceNumber_key" ON "Problem"("source", "sourceNumber");

-- CreateIndex
CREATE INDEX "Attempt_playerId_idx" ON "Attempt"("playerId");

-- CreateIndex
CREATE INDEX "Attempt_problemId_idx" ON "Attempt"("problemId");

-- CreateIndex
CREATE INDEX "Attempt_createdAt_idx" ON "Attempt"("createdAt");

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
