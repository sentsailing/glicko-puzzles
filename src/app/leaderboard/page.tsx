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

/** Medal colors for top 3. */
const MEDAL_COLORS = [
  "text-amber-400",   // gold
  "text-gray-400",    // silver
  "text-orange-600",  // bronze
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

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
        isCurrentPlayer
          ? `${tier.bg} ${tier.border} border`
          : "hover:bg-[var(--border)]/20"
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {isMedal ? (
          <span className={`text-lg font-bold ${MEDAL_COLORS[entry.rank - 1]}`}>
            {entry.rank}
          </span>
        ) : (
          <span className="text-sm font-medium text-[var(--muted)] tabular-nums">
            {entry.rank}
          </span>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold truncate">
          @{entry.username}
        </span>
      </div>

      {/* Rating + Tier icon (grouped together) */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div
          className={`${tier.color} ${isMedal ? "tier-icon-glow" : ""}`}
          style={isMedal ? { "--tier-glow": tier.hex } as React.CSSProperties : undefined}
        >
          <TierIcon tier={tier.name} size={isMedal ? 22 : 18} animate={isMedal} />
        </div>
        <span className={`text-sm font-bold tabular-nums ${tier.color}`}>
          {Math.round(entry.rating)}
        </span>
      </div>

      {/* Games */}
      <div className="w-16 text-right flex-shrink-0 hidden sm:block">
        <span className="text-xs text-[var(--muted)] tabular-nums">
          {entry.gamesPlayed} games
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
  const { user, signInWithGoogle } = useFirebaseAuth();
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
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          </div>
        </div>

        {/* Player rank card */}
        {data?.playerRank != null && player?.username && (
          <div
            className="w-full rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 mb-6 animate-fade-in-up stagger-1"
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
                    of {data.totalRanked} ranked players
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold tabular-nums">{Math.round(player.rating)}</div>
                <div className="text-xs text-[var(--muted)]">{player.gamesPlayed} games</div>
              </div>
            </div>
          </div>
        )}

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
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)]/30 transition-colors flex-shrink-0"
              >
                <GoogleIcon size={16} />
                Sign in
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
              <div className="divide-y divide-[var(--border)]/50">
                {data.leaderboard.map((entry) => (
                  <LeaderboardRow
                    key={entry.username}
                    entry={entry}
                    isCurrentPlayer={player?.username === entry.username}
                  />
                ))}
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
