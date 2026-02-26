import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, CheckUsernameResponse } from "@/types";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CheckUsernameResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 30 });
    if (rateLimited) return rateLimited;

    const username = request.nextUrl.searchParams.get("username") || "";

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        success: true,
        data: { available: false, username },
      });
    }

    const existing = await prisma.player.findUnique({
      where: { usernameLower: username.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: { available: !existing, username },
    });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check username" },
      { status: 500 }
    );
  }
}
