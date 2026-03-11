import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePlayer } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, LeaderboardResponse, ClosestRival } from "@/types";

const MIN_GAMES = 1;
const LEADERBOARD_LIMIT = 25;

/**
 * GET /api/leaderboard
 *
 * Returns top 25 ranked players (authenticated, with username, 1+ games).
 * Includes hourly rating changes and closest rival for the requesting player.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<LeaderboardResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 30 });
    if (rateLimited) return rateLimited;

    const { player: requestingPlayer } = await resolvePlayer(request);

    const rankedWhere = {
      firebaseUid: { not: null as string | null },
      username: { not: null as string | null },
      gamesPlayed: { gte: MIN_GAMES },
    };

    const allRanked = await prisma.player.findMany({
      where: rankedWhere,
      orderBy: { rating: "desc" as const },
      select: {
        id: true,
        username: true,
        displayName: true,
        rating: true,
        confirmedTier: true,
        gamesPlayed: true,
      },
    });

    const totalRanked = allRanked.length;
    const top = allRanked.slice(0, LEADERBOARD_LIMIT);
    const topIds = top.map((p) => p.id);

    // --- Hourly rating changes ---
    // For each top player, get their rating 1 hour ago (ratingAfter of last attempt before cutoff)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const hourAgoRatings = await prisma.$queryRaw<
      { playerId: string; ratingAfter: number }[]
    >`
      SELECT DISTINCT ON ("playerId") "playerId", "ratingAfter"
      FROM "Attempt"
      WHERE "playerId" = ANY(${topIds})
        AND "createdAt" < ${oneHourAgo}
      ORDER BY "playerId", "createdAt" DESC
    `;

    // Also check if each player has ANY attempts in the last hour
    const recentAttempts = await prisma.$queryRaw<
      { playerId: string }[]
    >`
      SELECT DISTINCT "playerId"
      FROM "Attempt"
      WHERE "playerId" = ANY(${topIds})
        AND "createdAt" >= ${oneHourAgo}
    `;
    const hasRecentActivity = new Set(recentAttempts.map((r) => r.playerId));

    const hourAgoMap = new Map<string, number>();
    for (const row of hourAgoRatings) {
      hourAgoMap.set(row.playerId, row.ratingAfter);
    }

    const leaderboard = top.map((p, i) => {
      let ratingChange: number | null = null;

      if (hasRecentActivity.has(p.id)) {
        // Player was active in the last hour
        const prevRating = hourAgoMap.get(p.id);
        if (prevRating != null) {
          ratingChange = Math.round(p.rating - prevRating);
        } else {
          // All their attempts are within the last hour (brand new player)
          // Show change from default 1200
          ratingChange = Math.round(p.rating - 1200);
        }
      }
      // If no recent activity, ratingChange stays null (nothing to show)

      return {
        rank: i + 1,
        username: p.username!,
        displayName: p.displayName,
        rating: p.rating,
        confirmedTier: p.confirmedTier,
        gamesPlayed: p.gamesPlayed,
        ratingChange,
      };
    });

    // --- Player rank & closest rival ---
    let playerRank: number | null = null;
    let closestRival: ClosestRival | null = null;

    if (
      requestingPlayer?.firebaseUid &&
      requestingPlayer.username &&
      requestingPlayer.gamesPlayed >= MIN_GAMES
    ) {
      const playerIdx = allRanked.findIndex((p) => p.id === requestingPlayer.id);
      if (playerIdx >= 0) {
        playerRank = playerIdx + 1;

        if (playerIdx > 0) {
          const rival = allRanked[playerIdx - 1];
          closestRival = {
            username: rival.username!,
            rating: rival.rating,
            pointsAhead: Math.round(rival.rating - requestingPlayer.rating),
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: { leaderboard, playerRank, totalRanked, closestRival },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
