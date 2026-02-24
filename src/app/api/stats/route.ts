import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePlayer } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, StatsResponse } from "@/types";

/**
 * GET /api/stats
 *
 * Get statistics for the current player.
 * Includes rating history, accuracy, and recent attempts.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<StatsResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 20 });
    if (rateLimited) return rateLimited;

    const { player: resolvedPlayer, error: authError } = await resolvePlayer(request);

    if (!resolvedPlayer) {
      return NextResponse.json(
        { success: false, error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Re-fetch with attempts included
    const player = await prisma.player.findUnique({
      where: { id: resolvedPlayer.id },
      include: {
        attempts: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            problem: {
              select: { content: true, source: true, sourceNumber: true },
            },
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    // Calculate accuracy
    const totalAttempts = player.attempts.length;
    const correctAttempts = player.attempts.filter((a: { correct: boolean }) => a.correct).length;
    const accuracyPercentage =
      totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    // Build rating history (from attempts)
    const ratingHistory = player.attempts
      .slice()
      .reverse() // Oldest first for chart
      .map((attempt: { ratingAfter: number; createdAt: Date }) => ({
        rating: attempt.ratingAfter,
        timestamp: attempt.createdAt.toISOString(),
      }));

    // Recent attempts (last 10)
    const recentAttempts = player.attempts.slice(0, 10).map((attempt: {
      problem: { content: string; source: string | null; sourceNumber: number | null };
      correct: boolean;
      ratingAfter: number;
      ratingBefore: number;
      createdAt: Date;
    }) => ({
      problemContent: attempt.problem.content,
      source: attempt.problem.source,
      sourceNumber: attempt.problem.sourceNumber,
      correct: attempt.correct,
      ratingChange: attempt.ratingAfter - attempt.ratingBefore,
      timestamp: attempt.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        player: {
          rating: player.rating,
          gamesPlayed: player.gamesPlayed,
          createdAt: player.createdAt.toISOString(),
        },
        accuracy: {
          total: totalAttempts,
          correct: correctAttempts,
          percentage: accuracyPercentage,
        },
        ratingHistory,
        recentAttempts,
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get stats",
      },
      { status: 500 }
    );
  }
}
