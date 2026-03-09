"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StatsDisplay } from "@/components/StatsDisplay";
import { useSessionContext } from "@/contexts/SessionContext";
import type { StatsResponse, ApiResponse } from "@/types";

export default function StatsPage() {
  const { player, loading: sessionLoading, fetchWithSession } = useSessionContext();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithSession("/api/stats");
      const result: ApiResponse<StatsResponse> = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || "Failed to load stats");
      }
    } catch {
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [fetchWithSession]);

  useEffect(() => {
    if (!sessionLoading && player) {
      fetchStats();
    }
  }, [sessionLoading, player, fetchStats]);

  if (sessionLoading) {
    return (
      <main id="main-content" className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted)]">Loading session...</div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="text-center py-12 text-[var(--muted)]">
              Loading stats...
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-[var(--error)]">{error}</div>
              <button
                onClick={fetchStats}
                className="px-4 py-2 bg-[var(--btn-primary)] text-[var(--btn-primary-text)] rounded-lg hover:bg-[var(--btn-primary-hover)]"
              >
                Try Again
              </button>
            </div>
          ) : stats ? (
            stats.player.gamesPlayed === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="text-[var(--muted)]">
                  No attempts yet. Start playing to see your stats!
                </div>
                <Link
                  href="/play"
                  className="inline-block px-6 py-3 bg-[var(--btn-primary)] text-[var(--btn-primary-text)] font-medium rounded-lg hover:bg-[var(--btn-primary-hover)]"
                >
                  Start Playing
                </Link>
              </div>
            ) : (
              <StatsDisplay stats={stats} />
            )
          ) : null}
        </div>
      </div>
    </main>
  );
}
