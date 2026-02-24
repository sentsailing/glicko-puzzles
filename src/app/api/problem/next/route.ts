import { NextRequest, NextResponse } from "next/server";
import { selectNextProblem } from "@/lib/problems";
import { resolvePlayer } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, ProblemResponse } from "@/types";

/**
 * GET /api/problem/next
 *
 * Get the next problem for the current player.
 * Matches problem difficulty to player's rating.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ProblemResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 30 });
    if (rateLimited) return rateLimited;

    const { player, error: authError } = await resolvePlayer(request);

    if (!player) {
      return NextResponse.json(
        { success: false, error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Select next problem based on player rating
    const problem = await selectNextProblem({
      playerId: player.id,
      playerRating: player.rating,
    });

    if (!problem) {
      return NextResponse.json(
        {
          success: false,
          error: "No problems available",
        },
        { status: 404 }
      );
    }

    // Return problem WITHOUT the answer
    return NextResponse.json({
      success: true,
      data: {
        id: problem.id,
        content: problem.content,
        difficulty: problem.difficulty,
        answerType: problem.answerType,
        choices: problem.choices,
        source: problem.source ?? null,
        sourceNumber: problem.sourceNumber ?? null,
        problemRating: problem.rating,
      },
    });
  } catch (error) {
    console.error("Problem API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get next problem",
      },
      { status: 500 }
    );
  }
}
