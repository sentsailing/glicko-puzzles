"use client";

import type { StatsResponse } from "@/types";

interface StatsDisplayProps {
  stats: StatsResponse;
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  const { player, accuracy, ratingHistory, recentAttempts } = stats;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-[var(--border)] rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{Math.round(player.rating)}</div>
          <div className="text-sm text-[var(--muted)]">Current Rating</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{player.gamesPlayed}</div>
          <div className="text-sm text-[var(--muted)]">Problems Solved</div>
        </div>
        <div className="border border-[var(--border)] rounded-lg p-4 text-center">
          <div className="text-3xl font-bold">{accuracy.percentage}%</div>
          <div className="text-sm text-[var(--muted)]">Accuracy</div>
        </div>
      </div>

      {/* Accuracy Breakdown */}
      <div className="border border-[var(--border)] rounded-lg p-4">
        <h3 className="font-medium mb-3">Accuracy Breakdown</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-[var(--border)] rounded-full h-4 overflow-hidden">
            <div
              className="bg-[var(--success)] h-full transition-all"
              style={{ width: `${accuracy.percentage}%` }}
            />
          </div>
          <div className="text-sm text-[var(--muted)] whitespace-nowrap">
            {accuracy.correct} / {accuracy.total}
          </div>
        </div>
      </div>

      {/* Rating History */}
      {ratingHistory.length > 0 && (
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h3 className="font-medium mb-3">Rating History</h3>
          <div className="h-32 flex items-end gap-1">
            {ratingHistory.slice(-20).map((point, i) => {
              const min = Math.min(...ratingHistory.map((p) => p.rating));
              const max = Math.max(...ratingHistory.map((p) => p.rating));
              const range = max - min || 1;
              const height = ((point.rating - min) / range) * 100;

              return (
                <div
                  key={i}
                  className="flex-1 bg-[var(--accent)] rounded-t min-w-1"
                  style={{ height: `${Math.max(10, height)}%` }}
                  title={`Rating: ${Math.round(point.rating)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-[var(--muted)] mt-2">
            <span>Oldest</span>
            <span>Most Recent</span>
          </div>
        </div>
      )}

      {/* Recent Attempts */}
      {recentAttempts.length > 0 && (
        <div className="border border-[var(--border)] rounded-lg p-4">
          <h3 className="font-medium mb-3">Recent Attempts</h3>
          <div className="space-y-2">
            {recentAttempts.map((attempt, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      attempt.correct ? "bg-[var(--success)]" : "bg-[var(--error)]"
                    }`}
                  />
                  <span className="text-sm truncate max-w-xs">
                    {attempt.problemContent}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    attempt.ratingChange >= 0
                      ? "text-[var(--success)]"
                      : "text-[var(--error)]"
                  }`}
                >
                  {attempt.ratingChange >= 0 ? "+" : ""}
                  {Math.round(attempt.ratingChange)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
