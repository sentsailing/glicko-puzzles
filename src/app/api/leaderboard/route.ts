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
 * Includes daily rank changes and closest rival for the requesting player.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<LeaderboardResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 30 });
    if (rateLimited) return rateLimited;

    const { player: requestingPlayer } = await resolvePlayer(request);

    // All ranked players (needed for rank change computation + rival lookup)
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

    // --- Daily rank changes ---
    // Get each ranked player's rating ~24h ago by finding their last attempt
    // before the cutoff, or falling back to their current rating (no change).
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // For all ranked player IDs, get the last attempt before 24h ago
    const rankedIds = allRanked.map((p) => p.id);

    // Raw query: for each player, get ratingAfter from their most recent attempt before 24h ago
    const yesterdayRatings = await prisma.$queryRaw<
      { playerId: string; ratingAfter: number }[]
    >`
      SELECT DISTINCT ON ("playerId") "playerId", "ratingAfter"
      FROM "Attempt"
      WHERE "playerId" = ANY(${rankedIds})
        AND "createdAt" < ${oneDayAgo}
      ORDER BY "playerId", "createdAt" DESC
    `;

    const yesterdayRatingMap = new Map<string, number>();
    for (const row of yesterdayRatings) {
      yesterdayRatingMap.set(row.playerId, row.ratingAfter);
    }

    // Build yesterday's ranking: use yesterday's rating if available, else current (player is new today)
    const yesterdayRanking = allRanked
      .map((p) => ({
        id: p.id,
        rating: yesterdayRatingMap.get(p.id) ?? p.rating,
      }))
      .sort((a, b) => b.rating - a.rating);

    const yesterdayRankMap = new Map<string, number>();
    yesterdayRanking.forEach((p, i) => {
      yesterdayRankMap.set(p.id, i + 1);
    });

    // Build leaderboard with rank changes
    const top = allRanked.slice(0, LEADERBOARD_LIMIT);
    const leaderboard = top.map((p, i) => {
      const currentRank = i + 1;
      const prevRank = yesterdayRankMap.get(p.id);
      // If player had no attempts before 24h ago, they're new — show null
      const isNew = !yesterdayRatingMap.has(p.id);
      const rankChange = isNew ? null : (prevRank! - currentRank);

      return {
        rank: currentRank,
        username: p.username!,
        displayName: p.displayName,
        rating: p.rating,
        confirmedTier: p.confirmedTier,
        gamesPlayed: p.gamesPlayed,
        rankChange,
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

        // The player directly above on the leaderboard
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
