import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminAuth } from "@/lib/firebase-admin";
import { ratingSystem } from "@/lib/rating";
import type { Player } from "@prisma/client";

interface AuthResult {
  player: Player | null;
  error?: string;
}

const ACTIVE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/** Verify Firebase ID token. Firebase Admin SDK caches signing keys internally. */
async function verifyIdToken(idToken: string): Promise<string> {
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  return decoded.uid;
}

// --- Player lookup cache (avoids DB round-trip on every request) ---
const PLAYER_CACHE_TTL = 30_000; // 30 seconds
const playerCache = new Map<string, { player: Player; expiresAt: number }>();

/** Invalidate cached player so the next lookup hits the DB. */
export function invalidatePlayerCache(key: string) {
  playerCache.delete(key);
}

/** Look up player by firebaseUid, with short TTL cache. */
async function findPlayerCached(firebaseUid: string): Promise<Player | null> {
  const cached = playerCache.get(firebaseUid);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.player;
  }
  const player = await prisma.player.findUnique({ where: { firebaseUid } });
  if (player) {
    playerCache.set(firebaseUid, { player, expiresAt: Date.now() + PLAYER_CACHE_TTL });
  }
  return player;
}

/** Update lastActiveAt only if >5 minutes stale (fire-and-forget). */
function updateLastActive(player: Player) {
  if (player.lastActiveAt < new Date(Date.now() - ACTIVE_THROTTLE_MS)) {
    prisma.player.update({
      where: { id: player.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {});
  }
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
      const firebaseUid = await verifyIdToken(idToken);

      let player = await findPlayerCached(firebaseUid);

      if (!player) {
        // First-time Firebase sign-in (new account) — migrate anonymous session data
        const sessionToken = request.headers.get("x-session-token");
        if (sessionToken) {
          const anonymousPlayer = await prisma.player.findUnique({
            where: { sessionToken },
          });
          if (anonymousPlayer && !anonymousPlayer.firebaseUid) {
            // Migrate: upgrade anonymous player to authenticated
            player = await prisma.player.update({
              where: { id: anonymousPlayer.id },
              data: { firebaseUid },
            });
          }
        }

        // No migration candidate — create fresh authenticated player
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
      }
      // Existing account — anonymous session is NOT merged (intentional)

      // Update lastActiveAt (fire-and-forget, throttled to every 5 minutes)
      updateLastActive(player);

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
      updateLastActive(player);
      return { player };
    }
    return { player: null, error: "Player not found" };
  }

  return { player: null };
}
