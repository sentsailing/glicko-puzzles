import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePlayer } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, LeaderboardResponse } from "@/types";

const MIN_GAMES = 1;
const LEADERBOARD_LIMIT = 25;

/**
 * GET /api/leaderboard
 *
 * Returns top 50 ranked players (authenticated, with username, 10+ games).
 * Optionally includes the requesting player's rank.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<LeaderboardResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 30 });
    if (rateLimited) return rateLimited;

    // Resolve requesting player (optional — anonymous users can view leaderboard)
    const { player: requestingPlayer } = await resolvePlayer(request);

    // Top 50 by rating — only authenticated players with usernames and enough games
    const topPlayers = await prisma.player.findMany({
      where: {
        firebaseUid: { not: null },
        username: { not: null },
        gamesPlayed: { gte: MIN_GAMES },
      },
      orderBy: { rating: "desc" },
      take: LEADERBOARD_LIMIT,
      select: {
        id: true,
        username: true,
        displayName: true,
        rating: true,
        confirmedTier: true,
        gamesPlayed: true,
      },
    });

    const leaderboard = topPlayers.map((p, i) => ({
      rank: i + 1,
      username: p.username!,
      displayName: p.displayName,
      rating: p.rating,
      confirmedTier: p.confirmedTier,
      gamesPlayed: p.gamesPlayed,
    }));

    // Count total ranked players
    const totalRanked = await prisma.player.count({
      where: {
        firebaseUid: { not: null },
        username: { not: null },
        gamesPlayed: { gte: MIN_GAMES },
      },
    });

    // Compute requesting player's rank if they qualify
    let playerRank: number | null = null;
    if (
      requestingPlayer?.firebaseUid &&
      requestingPlayer.username &&
      requestingPlayer.gamesPlayed >= MIN_GAMES
    ) {
      // Count how many ranked players have a higher rating
      const playersAbove = await prisma.player.count({
        where: {
          firebaseUid: { not: null },
          username: { not: null },
          gamesPlayed: { gte: MIN_GAMES },
          rating: { gt: requestingPlayer.rating },
        },
      });
      playerRank = playersAbove + 1;
    }

    return NextResponse.json({
      success: true,
      data: { leaderboard, playerRank, totalRanked },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
