import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePlayer } from "@/lib/auth";
import type { ApiResponse } from "@/types";

/**
 * POST /api/report
 *
 * Submit a problem report (formatting issue, wrong answer, etc.).
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const { player } = await resolvePlayer(request);

    const body = await request.json();
    const { problemId, type, details } = body;

    if (!problemId || !type) {
      return NextResponse.json(
        { success: false, error: "problemId and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["FORMATTING", "WRONG_ANSWER", "OTHER"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid report type" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        problemId,
        playerId: player?.id ?? null,
        type,
        details: details || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: report.id },
    });
  } catch (error) {
    console.error("Report API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
