"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TierIcon } from "@/components/TierIcon";
import { TIERS } from "@/lib/tiers";
import { useSessionContext } from "@/contexts/SessionContext";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { GoogleIcon } from "@/components/GoogleIcon";
import type { ApiResponse, LeaderboardResponse, LeaderboardEntry } from "@/types";

function getTierByName(name: string) {
  return TIERS.find((t) => t.name === name) ?? TIERS[0];
}

/** Medal SVG colors for top 3. */
const MEDAL_FILL = [
  { outer: "#f59e0b", inner: "#fbbf24", text: "#78350f" }, // gold
  { outer: "#9ca3af", inner: "#d1d5db", text: "#374151" }, // silver
  { outer: "#c2410c", inner: "#ea580c", text: "#431407" }, // bronze
];

function MedalIcon({ rank, size = 28 }: { rank: 1 | 2 | 3; size?: number }) {
  const m = MEDAL_FILL[rank - 1];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Ribbon tails */}
      <path d="M11 4L8 0H12L14 4Z" fill={m.outer} opacity={0.5} />
      <path d="M21 4L24 0H20L18 4Z" fill={m.outer} opacity={0.5} />
      {/* Medal body */}
      <circle cx="16" cy="18" r="13" fill={m.outer} />
      <circle cx="16" cy="18" r="10.5" fill={m.inner} />
      <circle cx="16" cy="18" r="9" fill={m.outer} opacity={0.15} />
      {/* Rank number */}
      <text x="16" y="23" textAnchor="middle" fontSize="13" fontWeight="800" fill={m.text} fontFamily="system-ui">
        {rank}
      </text>
    </svg>
  );
}

/** Shiny gradient styles + glow for top 3 usernames. */
const MEDAL_USERNAME_STYLES: React.CSSProperties[] = [
  { background: "linear-gradient(135deg, #fbbf24, #f59e0b, #fcd34d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))" }, // gold
  { background: "linear-gradient(135deg, #d1d5db, #9ca3af, #e5e7eb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 6px rgba(156, 163, 175, 0.5))" }, // silver
  { background: "linear-gradient(135deg, #ea580c, #c2410c, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 6px rgba(234, 88, 12, 0.5))" }, // bronze
];

function LeaderboardRow({
  entry,
  isCurrentPlayer,
}: {
  entry: LeaderboardEntry;
  isCurrentPlayer: boolean;
}) {
  const tier = getTierByName(entry.confirmedTier);
  const isMedal = entry.rank <= 3;
  const rc = entry.ratingChange;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isCurrentPlayer
          ? `${tier.bg} ${tier.border} border`
          : "hover:bg-[var(--border)]/20"
      }`}
      style={{ borderLeft: `3px solid ${isMedal ? MEDAL_FILL[entry.rank - 1].inner : tier.hex}` }}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {isMedal ? (
          <MedalIcon rank={entry.rank as 1 | 2 | 3} />
        ) : (
          <span className="text-sm font-medium text-[var(--muted)] tabular-nums">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm font-semibold truncate ${isMedal ? "" : tier.color}`}
          style={isMedal
            ? MEDAL_USERNAME_STYLES[entry.rank - 1]
            : { filter: `drop-shadow(0 0 4px ${tier.hex}80)` }
          }
        >
          @{entry.username}
        </span>
      </div>

      {/* Rating + Tier icon */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className={`${isMedal ? "" : tier.color} tier-icon-glow`}
          style={isMedal
            ? { color: MEDAL_FILL[entry.rank - 1].inner, "--tier-glow": MEDAL_FILL[entry.rank - 1].inner } as React.CSSProperties
            : { "--tier-glow": tier.hex } as React.CSSProperties
          }
        >
          <TierIcon tier={tier.name} size={isMedal ? 22 : 18} animate={isMedal} />
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${isMedal ? "" : tier.color}`}
          style={isMedal
            ? MEDAL_USERNAME_STYLES[entry.rank - 1]
            : { filter: `drop-shadow(0 0 4px ${tier.hex}80)` }
          }
        >
          {Math.round(entry.rating)}
        </span>
      </div>

      {/* Daily rating change */}
      <div className="w-16 flex-shrink-0 ml-2">
        {rc != null && rc !== 0 ? (
          <span className={`text-xs font-bold tabular-nums flex items-center gap-1 ${rc > 0 ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
            <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 10 10" fill="currentColor">
              {rc > 0
                ? <path d="M5 1L9 6H1Z" />
                : <path d="M5 9L1 4H9Z" />
              }
            </svg>
            <span>{Math.abs(rc)}</span>
          </span>
        ) : (
          <span className="text-xs text-[var(--muted)]/40 tabular-nums pl-3.5">&mdash;</span>
        )}
      </div>

      {/* Games */}
      <div className="w-16 text-right flex-shrink-0 hidden sm:block">
        <span className="text-xs text-[var(--muted)] tabular-nums">
          {entry.gamesPlayed}
        </span>
      </div>

      {/* Current player indicator */}
      {isCurrentPlayer && (
        <div className={`text-[10px] font-bold ${tier.color} flex-shrink-0`}>
          YOU
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { player, fetchWithSession } = useSessionContext();
  const { user, signingIn, signInWithGoogle } = useFirebaseAuth();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetchWithSession("/api/leaderboard");
        const result: ApiResponse<LeaderboardResponse> = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load leaderboard");
        }
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [fetchWithSession]);

  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-2xl mx-auto w-full">
        {/* Title */}
        <div className="w-full mb-6 animate-fade-in-up">
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard (Top 25)</h1>
        </div>

        {/* Sign-in nudge */}
        {!user && (
          <div
            className="w-full rounded-xl border border-dashed border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 mb-6 animate-fade-in-up stagger-1"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--accent)] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium">Sign in to appear on the leaderboard</p>
                <p className="text-xs text-[var(--muted)]">Play 10+ problems with a username to get ranked.</p>
              </div>
              <button
                onClick={signInWithGoogle}
                disabled={signingIn}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium transition-colors flex-shrink-0 ${
                  signingIn ? "opacity-70 cursor-wait" : "hover:bg-[var(--border)]/30"
                }`}
              >
                {signingIn ? (
                  <svg className="w-4 h-4 animate-spin text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <GoogleIcon size={16} />
                )}
                {signingIn ? "Signing in\u2026" : "Sign in"}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-[var(--muted)]">Loading leaderboard...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-[var(--error)]">{error}</div>
          </div>
        )}

        {/* Leaderboard table */}
        {data && !loading && (
          <div
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden animate-fade-in-up stagger-2"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            {/* Header row */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--border)]/20">
              <div className="w-8 text-center flex-shrink-0">
                <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">#</span>
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">Player</span>
              </div>
              <div className="flex-shrink-0">
                <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">Rating</span>
              </div>
              <div className="w-16 flex-shrink-0 ml-2">
                <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">24h</span>
              </div>
              <div className="w-16 text-right flex-shrink-0 hidden sm:block">
                <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">Games</span>
              </div>
            </div>

            {/* Rows */}
            {data.leaderboard.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                No ranked players yet. Be the first!
              </div>
            ) : (
              <>
                {/* Podium — top 3 */}
                {data.leaderboard.filter((e) => e.rank <= 3).length > 0 && (
                  <div className="bg-gradient-to-b from-amber-500/[0.04] to-transparent py-1">
                    {data.leaderboard
                      .filter((e) => e.rank <= 3)
                      .map((entry) => (
                        <LeaderboardRow
                          key={entry.username}
                          entry={entry}
                          isCurrentPlayer={player?.username === entry.username}
                        />
                      ))}
                  </div>
                )}
                {/* Separator */}
                {data.leaderboard.some((e) => e.rank > 3) && (
                  <div className="flex items-center gap-3 px-6 py-0.5">
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-500/20 via-[var(--border)] to-amber-500/20" />
                  </div>
                )}
                {/* Rest */}
                <div className="divide-y divide-[var(--border)]/50">
                  {data.leaderboard
                    .filter((e) => e.rank > 3)
                    .map((entry) => (
                      <LeaderboardRow
                        key={entry.username}
                        entry={entry}
                        isCurrentPlayer={player?.username === entry.username}
                      />
                    ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Player rank card */}
        {data?.playerRank != null && player?.username && (
          <div
            className="w-full rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 mt-6 animate-fade-in-up stagger-3"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold tabular-nums text-[var(--accent)]">
                  #{data.playerRank}
                </div>
                <div>
                  <div className="text-sm font-semibold">@{player.username}</div>
                  <div className="text-xs text-[var(--muted)]">
                    Top {Math.max(1, Math.round(((data.playerRank) / data.totalRanked) * 100))}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold tabular-nums">{Math.round(player.rating)}</div>
                <div className="text-xs text-[var(--muted)]">{player.gamesPlayed} games</div>
              </div>
            </div>
            {data.closestRival && (
              <div className="mt-3 pt-3 border-t border-[var(--accent)]/20 flex items-center gap-2 text-xs">
                <svg className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className="text-[var(--muted)]">
                  <span className="font-semibold text-[var(--foreground)]">{data.closestRival.pointsAhead} pts</span> behind <span className="font-semibold text-[var(--foreground)]">@{data.closestRival.username}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        {data && !loading && (
          <div className="text-center mt-6 text-xs text-[var(--muted)]">
            Sign in and set a username to appear on the leaderboard.
          </div>
        )}
      </div>
    </main>
  );
}
