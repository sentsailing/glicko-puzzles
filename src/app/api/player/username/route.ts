import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolvePlayer, invalidatePlayerCache } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse, SetUsernameResponse } from "@/types";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<SetUsernameResponse>>> {
  try {
    const rateLimited = checkRateLimit(request, { limit: 10 });
    if (rateLimited) return rateLimited;

    const { player } = await resolvePlayer(request);
    if (!player || !player.firebaseUid) {
      return NextResponse.json(
        { success: false, error: "Must be signed in with Google" },
        { status: 401 }
      );
    }

    if (player.username) {
      return NextResponse.json(
        { success: false, error: "Username already set" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const username = body.username?.trim();
    const displayName = body.displayName?.trim() || null;

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        {
          success: false,
          error: "Username must be 3-20 characters (letters, numbers, underscores)",
        },
        { status: 400 }
      );
    }

    // Check case-insensitive collision
    const existing = await prisma.player.findUnique({
      where: { usernameLower: username.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    try {
      const updated = await prisma.player.update({
        where: { id: player.id },
        data: {
          username,
          usernameLower: username.toLowerCase(),
          displayName,
        },
      });

      // Invalidate player cache so the next /api/player call sees the new username
      if (player.firebaseUid) {
        invalidatePlayerCache(player.firebaseUid);
      }

      return NextResponse.json({
        success: true,
        data: {
          username: updated.username!,
          displayName: updated.displayName,
        },
      });
    } catch {
      // Race condition: another user took this username between check and update
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Set username error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set username" },
      { status: 500 }
    );
  }
}
