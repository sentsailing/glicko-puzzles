import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePlayer } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, StatsResponse } from "@/types";

/**
 * GET /api/stats
 *
 * Get statistics for the current player.
 * Includes rating history, accuracy, streaks, difficulty breakdown, and activity heatmap.
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

    const isAuthenticated = resolvedPlayer.firebaseUid !== null;

    // Fetch all attempts for comprehensive stats
    const player = await prisma.player.findUnique({
      where: { id: resolvedPlayer.id },
      include: {
        attempts: {
          orderBy: { createdAt: "asc" },
          include: {
            problem: {
              select: { content: true, source: true, sourceNumber: true, difficulty: true },
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

    const allAttempts = player.attempts;
    const totalAttempts = allAttempts.length;
    const correctAttempts = allAttempts.filter((a) => a.correct).length;
    const accuracyPercentage =
      totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    // Peak rating
    const peakRating = totalAttempts > 0
      ? Math.max(...allAttempts.map((a) => a.ratingAfter))
      : player.rating;

    // Streaks (iterate oldest-first)
    let bestStreak = 0;
    let currentStreak = 0;
    for (const attempt of allAttempts) {
      if (attempt.correct) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Rating history (oldest first for chart) — cap at last 50
    const historySlice = allAttempts.slice(-50);
    const ratingHistory = historySlice.map((a) => ({
      rating: a.ratingAfter,
      timestamp: a.createdAt.toISOString(),
    }));

    // Recent attempts (last 10, newest first)
    const recentAttempts = allAttempts.slice(-10).reverse().map((a) => ({
      problemContent: a.problem.content,
      source: a.problem.source,
      sourceNumber: a.problem.sourceNumber,
      correct: a.correct,
      ratingChange: a.ratingAfter - a.ratingBefore,
      timestamp: a.createdAt.toISOString(),
    }));

    // Difficulty breakdown
    const diffBreakdown = { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } };
    for (const a of allAttempts) {
      const diff = a.problem.difficulty.toLowerCase() as "easy" | "medium" | "hard";
      if (diffBreakdown[diff]) {
        diffBreakdown[diff].total++;
        if (a.correct) diffBreakdown[diff].correct++;
      }
    }

    // Activity heatmap (authenticated only, last 90 days)
    let activityHeatmap: Array<{ date: string; count: number }> | undefined;
    if (isAuthenticated) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dayCounts = new Map<string, number>();
      for (const a of allAttempts) {
        if (a.createdAt >= ninetyDaysAgo) {
          const day = a.createdAt.toISOString().slice(0, 10);
          dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
        }
      }
      activityHeatmap = Array.from(dayCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    return NextResponse.json({
      success: true,
      data: {
        player: {
          rating: player.rating,
          gamesPlayed: player.gamesPlayed,
          createdAt: player.createdAt.toISOString(),
          username: player.username ?? null,
          displayName: player.displayName ?? null,
          isAuthenticated,
          ratingDeviation: player.ratingDeviation,
          peakRating,
          currentStreak,
          bestStreak,
          tierName: player.confirmedTier,
        },
        accuracy: {
          total: totalAttempts,
          correct: correctAttempts,
          percentage: accuracyPercentage,
        },
        ratingHistory,
        recentAttempts,
        difficultyBreakdown: diffBreakdown,
        activityHeatmap,
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
