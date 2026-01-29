import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminAuth } from "@/lib/firebase-admin";
import { ratingSystem } from "@/lib/rating";
import type { Player } from "@prisma/client";

interface AuthResult {
  player: Player | null;
  error?: string;
}

/**
 * Resolve the authenticated player from the request.
 *
 * Supports two auth strategies:
 * 1. Firebase ID token via Authorization: Bearer <token>
 * 2. Anonymous session token via x-session-token header
 *
 * Firebase takes priority if both are present.
 */
export async function resolvePlayer(
  request: NextRequest
): Promise<AuthResult> {
  // Strategy 1: Firebase ID token
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.slice(7);
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      const firebaseUid = decoded.uid;

      let player = await prisma.player.findUnique({
        where: { firebaseUid },
      });

      if (!player) {
        player = await prisma.player.create({
          data: {
            sessionToken: crypto.randomUUID(),
            firebaseUid,
            rating: ratingSystem.getDefaultRating(),
            ratingDeviation: ratingSystem.getDefaultRD(),
            gamesPlayed: 0,
          },
        });
      }

      return { player };
    } catch (err) {
      console.error("Firebase token verification failed:", err);
      return { player: null, error: "Invalid Firebase token" };
    }
  }

  // Strategy 2: Anonymous session token
  const sessionToken = request.headers.get("x-session-token");
  if (sessionToken) {
    const player = await prisma.player.findUnique({
      where: { sessionToken },
    });
    if (player) {
      return { player };
    }
    return { player: null, error: "Player not found" };
  }

  return { player: null };
}
