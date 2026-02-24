import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Lazy cleanup interval
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Sliding-window rate limiter.
 * Returns null if within limit, or a 429 NextResponse if exceeded.
 */
export function checkRateLimit(
  request: NextRequest,
  options: { limit: number; windowMs?: number }
): NextResponse<ApiResponse<never>> | null {
  const { limit, windowMs = 60_000 } = options;
  const now = Date.now();

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";

  const path = new URL(request.url).pathname;
  const key = `${ip}:${path}`;

  cleanup(windowMs);

  const entry = store.get(key) ?? { timestamps: [] };
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) },
      }
    );
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return null;
}
