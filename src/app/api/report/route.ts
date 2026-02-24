import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePlayer } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/report
 *
 * Submit a problem report (formatting issue, wrong answer, etc.).
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 5 });
    if (rateLimited) return rateLimited;

    const { player } = await resolvePlayer(request);

    const body = await request.json();
    const { problemId, type, details } = body;

    if (!problemId || typeof problemId !== "string" || !UUID_RE.test(problemId)) {
      return NextResponse.json(
        { success: false, error: "Valid problemId is required" },
        { status: 400 }
      );
    }

    const validTypes = ["FORMATTING", "WRONG_ANSWER", "OTHER"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: "type must be FORMATTING, WRONG_ANSWER, or OTHER" },
        { status: 400 }
      );
    }

    if (details !== undefined && (typeof details !== "string" || details.length > 1000)) {
      return NextResponse.json(
        { success: false, error: "details must be a string (max 1000 chars)" },
        { status: 400 }
      );
    }

    // Verify problem exists
    const problemExists = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true },
    });
    if (!problemExists) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 }
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
