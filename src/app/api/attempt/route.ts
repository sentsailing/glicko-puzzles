import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ratingSystem } from "@/lib/rating";
import { checkAnswer } from "@/lib/problems";
import { updateConfirmedTier } from "@/lib/tiers";
import { resolvePlayer, invalidatePlayerCache } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, AttemptResponse } from "@/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/attempt
 *
 * Submit an answer for a problem.
 * Returns whether the answer was correct, the new rating, and the next problem.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AttemptResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 30 });
    if (rateLimited) return rateLimited;

    // Parse and validate request body first (fast, no DB)
    const body = await request.json();
    const { problemId, answer } = body;

    if (!problemId || typeof problemId !== "string" || !UUID_RE.test(problemId)) {
      return NextResponse.json(
        { success: false, error: "Valid problemId is required" },
        { status: 400 }
      );
    }

    if (answer === undefined || answer === null || typeof answer !== "string" || answer.length > 100) {
      return NextResponse.json(
        { success: false, error: "answer is required and must be a string (max 100 chars)" },
        { status: 400 }
      );
    }

    // Parallelize auth and problem fetch — they don't depend on each other
    const [{ player, error: authError }, problem] = await Promise.all([
      resolvePlayer(request),
      prisma.problem.findUnique({
        where: { id: problemId },
        select: {
          id: true,
          answer: true,
          rating: true,
          ratingDeviation: true,
          volatility: true,
        },
      }),
    ]);

    if (!player) {
      return NextResponse.json(
        { success: false, error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 }
      );
    }

    // Check if answer is correct
    const correct = checkAnswer(answer, problem.answer);

    // Calculate new ratings
    const ratingResult = ratingSystem.calculateNewRatings({
      playerRating: player.rating,
      problemRating: problem.rating,
      playerWon: correct,
      playerRD: player.ratingDeviation,
      problemRD: problem.ratingDeviation,
      playerVolatility: player.volatility,
      problemVolatility: problem.volatility,
    });

    // Compute tier hysteresis
    const tierResult = updateConfirmedTier(
      ratingResult.newPlayerRating,
      player.confirmedTier,
      player.tierStreak,
    );

    // Update player and problem ratings, create attempt record
    const [attempt] = await prisma.$transaction([
      prisma.attempt.create({
        data: {
          playerId: player.id,
          problemId: problem.id,
          answer: answer,
          correct: correct,
          ratingBefore: player.rating,
          ratingAfter: ratingResult.newPlayerRating,
        },
      }),
      prisma.player.update({
        where: { id: player.id },
        data: {
          rating: ratingResult.newPlayerRating,
          ratingDeviation: ratingResult.newPlayerRD,
          volatility: ratingResult.newPlayerVolatility,
          gamesPlayed: { increment: 1 },
          confirmedTier: tierResult.confirmedTier,
          tierStreak: tierResult.tierStreak,
        },
      }),
      prisma.problem.update({
        where: { id: problem.id },
        data: {
          rating: ratingResult.newProblemRating,
          ratingDeviation: ratingResult.newProblemRD,
          volatility: ratingResult.newProblemVolatility,
        },
      }),
    ]);

    // Invalidate player cache so subsequent requests see updated rating
    if (player.firebaseUid) invalidatePlayerCache(player.firebaseUid);

    return NextResponse.json({
      success: true,
      data: {
        id: attempt.id,
        correct: correct,
        correctAnswer: problem.answer,
        ratingBefore: player.rating,
        ratingAfter: ratingResult.newPlayerRating,
        ratingChange: ratingResult.newPlayerRating - player.rating,
        nextProblem: null,
        tierChange: tierResult.tierChange ?? null,
      },
    });
  } catch (error) {
    console.error("Attempt API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit attempt",
      },
      { status: 500 }
    );
  }
}
