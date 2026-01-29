import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ratingSystem } from "@/lib/rating";
import { resolvePlayer } from "@/lib/auth";
import type { ApiResponse, PlayerResponse } from "@/types";

/**
 * GET /api/player
 *
 * Get or create a player session.
 * Supports Firebase auth (Bearer token) or anonymous session (x-session-token).
 * If neither is provided, creates a new anonymous player.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<PlayerResponse>>> {
  try {
    const { player, error } = await resolvePlayer(request);

    if (player) {
      return NextResponse.json({
        success: true,
        data: {
          id: player.id,
          sessionToken: player.sessionToken,
          rating: player.rating,
          gamesPlayed: player.gamesPlayed,
          isAuthenticated: player.firebaseUid !== null,
        },
      });
    }

    // If there was an explicit auth error (e.g. invalid Firebase token), return 401
    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 401 }
      );
    }

    // No auth headers at all — create a new anonymous player
    const newSessionToken = crypto.randomUUID();
    const defaultRating = ratingSystem.getDefaultRating();
    const defaultRD = ratingSystem.getDefaultRD();

    const newPlayer = await prisma.player.create({
      data: {
        sessionToken: newSessionToken,
        rating: defaultRating,
        ratingDeviation: defaultRD,
        gamesPlayed: 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newPlayer.id,
        sessionToken: newPlayer.sessionToken,
        rating: newPlayer.rating,
        gamesPlayed: newPlayer.gamesPlayed,
        isAuthenticated: false,
      },
    });
  } catch (error) {
    console.error("Player API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get or create player",
      },
      { status: 500 }
    );
  }
}
