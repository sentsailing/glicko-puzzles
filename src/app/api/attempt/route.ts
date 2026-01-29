import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ratingSystem } from "@/lib/rating";
import { checkAnswer } from "@/lib/problems";
import { resolvePlayer } from "@/lib/auth";
import type { ApiResponse, AttemptRequest, AttemptResponse } from "@/types";

/**
 * POST /api/attempt
 *
 * Submit an answer for a problem.
 * Returns whether the answer was correct and the new rating.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AttemptResponse>>> {
  try {
    const { player, error: authError } = await resolvePlayer(request);

    if (!player) {
      return NextResponse.json(
        { success: false, error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body: AttemptRequest = await request.json();
    const { problemId, answer } = body;

    if (!problemId || answer === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "problemId and answer are required",
        },
        { status: 400 }
      );
    }

    // Find problem
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json(
        {
          success: false,
          error: "Problem not found",
        },
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

    // Update player and problem ratings, create attempt record
    const [attempt] = await prisma.$transaction([
      // Create attempt record
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
      // Update player rating
      prisma.player.update({
        where: { id: player.id },
        data: {
          rating: ratingResult.newPlayerRating,
          ratingDeviation: ratingResult.newPlayerRD,
          volatility: ratingResult.newPlayerVolatility,
          gamesPlayed: { increment: 1 },
        },
      }),
      // Update problem rating
      prisma.problem.update({
        where: { id: problem.id },
        data: {
          rating: ratingResult.newProblemRating,
          ratingDeviation: ratingResult.newProblemRD,
          volatility: ratingResult.newProblemVolatility,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: attempt.id,
        correct: correct,
        correctAnswer: problem.answer,
        ratingBefore: player.rating,
        ratingAfter: ratingResult.newPlayerRating,
        ratingChange: ratingResult.newPlayerRating - player.rating,
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
