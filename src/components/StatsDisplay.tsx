"use client";

import type { StatsResponse } from "@/types";
import { getTier, getTierProgress, TIERS } from "@/lib/tiers";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { DifficultyBreakdown } from "./DifficultyBreakdown";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { GoogleIcon } from "./GoogleIcon";
import { TierIcon } from "./TierIcon";

interface StatsDisplayProps {
  stats: StatsResponse;
}

/** Format a timestamp as relative time (e.g. "2m ago"). */
function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** SVG line chart for rating history. */
function RatingChart({ history }: { history: Array<{ rating: number; timestamp: string }> }) {
  if (history.length < 2) return null;

  const W = 600;
  const H = 140;
  const PAD_X = 8;
  const PAD_Y = 12;

  const ratings = history.map((h) => h.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  const padding = Math.max((max - min) * 0.1, 5);
  const yMin = min - padding;
  const yMax = max + padding;
  const yRange = yMax - yMin;

  const points = history.map((h, i) => ({
    x: PAD_X + (i / (history.length - 1)) * (W - 2 * PAD_X),
    y: H - PAD_Y - ((h.rating - yMin) / yRange) * (H - 2 * PAD_Y),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Gradient fill below line
  const fillPath = `M${points[0].x},${points[0].y} ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "140px" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Fill under line */}
      <path d={fillPath} fill="url(#chartGrad)" />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point highlight */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={4}
        fill="var(--accent)"
      />
    </svg>
  );
}

export function StatsDisplay({ stats }: StatsDisplayProps) {
  const { player, accuracy, ratingHistory, recentAttempts, difficultyBreakdown, activityHeatmap } = stats;
  const { user, signInWithGoogle } = useFirebaseAuth();
  // Use confirmed tier for display, live rating for progress bar
  const tier = (player.tierName ? TIERS.find((t) => t.name === player.tierName) : null) ?? getTier(player.rating);
  const progress = getTierProgress(player.rating);

  const memberSince = new Date(player.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column: main stats */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Hero: Tier + Rating */}
        <div
          className={`rounded-xl border ${tier.border} ${tier.bg} p-6 sm:p-8 animate-fade-in-up`}
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex items-center gap-5">
            <div className={`${tier.color} tier-icon-glow`} style={{ "--tier-glow": tier.hex } as React.CSSProperties}>
              <TierIcon tier={tier.name} size={64} animate />
            </div>
            <div className="flex-1 min-w-0">
              {player.username && (
                <div className="text-sm font-medium text-[var(--muted)] mb-0.5">@{player.username}</div>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums">
                  {Math.round(player.rating)}
                </span>
              </div>
              <div className={`text-lg font-semibold mt-1 ${tier.color}`}>
                {tier.name}
              </div>
              {/* Progress to next tier */}
              <div className="mt-3 max-w-sm">
                <div className="flex justify-between text-xs text-[var(--muted)] mb-1 tabular-nums">
                  <span>{tier.threshold}</span>
                  <span>{Math.round(progress)}% to {tier.nextThreshold}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${tier.barColor} transition-all duration-1000 ease-out`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards — Row 1 */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4 animate-fade-in-up stagger-1"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                Solved
              </div>
            </div>
            <div className="text-3xl font-bold tabular-nums">{player.gamesPlayed}</div>
          </div>
          <div
            className="rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/5 p-4 animate-fade-in-up stagger-2"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--success)]/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--success)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" fill="currentColor" /></svg>
              </div>
              <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                Accuracy
              </div>
            </div>
            <div className="text-3xl font-bold tabular-nums">{accuracy.percentage}%</div>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--success)] transition-all duration-700"
                style={{ width: `${accuracy.percentage}%` }}
              />
            </div>
          </div>
          <div
            className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 animate-fade-in-up stagger-3"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </div>
              <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                Best Streak
              </div>
            </div>
            <div className="text-3xl font-bold tabular-nums">{player.bestStreak}</div>
          </div>
        </div>

        {/* Stat Cards — Row 2 */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 animate-fade-in-up stagger-2"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                Peak
              </div>
            </div>
            <div className="text-3xl font-bold tabular-nums">{Math.round(player.peakRating)}</div>
          </div>
          <div
            className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 animate-fade-in-up stagger-3"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              </div>
              <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                Streak
              </div>
            </div>
            <div className="text-3xl font-bold tabular-nums">{player.currentStreak}</div>
          </div>
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 animate-fade-in-up stagger-4"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--border)]/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                Member
              </div>
            </div>
            <div className="text-lg font-bold">{memberSince}</div>
          </div>
        </div>

        {/* Rating History Chart */}
        {ratingHistory.length > 1 && (
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5 animate-fade-in-up stagger-4"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                Rating History
              </div>
              <div className="text-xs text-[var(--muted)] tabular-nums">
                {ratingHistory.length} games
              </div>
            </div>
            <RatingChart history={ratingHistory} />
            <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1 tabular-nums">
              <span>{Math.round(Math.min(...ratingHistory.map((h) => h.rating)))}</span>
              <span>{Math.round(Math.max(...ratingHistory.map((h) => h.rating)))}</span>
            </div>
          </div>
        )}

        {/* Difficulty Breakdown */}
        {difficultyBreakdown && (
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5 animate-fade-in-up stagger-5"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
              Difficulty Breakdown
            </div>
            <DifficultyBreakdown breakdown={difficultyBreakdown} />
          </div>
        )}

        {/* Activity Heatmap (authenticated only) */}
        {activityHeatmap && activityHeatmap.length > 0 && (
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5 animate-fade-in-up stagger-5"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
              Activity (Last 90 Days)
            </div>
            <ActivityHeatmap data={activityHeatmap} />
          </div>
        )}

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <div
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5 animate-fade-in-up stagger-5"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-3">
              Recent Attempts
            </div>
            <div className="space-y-0">
              {recentAttempts.map((attempt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2.5 border-b border-[var(--border)]/50 last:border-0"
                >
                  {/* Correct/incorrect arrow */}
                  <span
                    className={`text-sm font-bold flex-shrink-0 ${
                      attempt.correct ? "text-[var(--success)]" : "text-[var(--error)]"
                    }`}
                  >
                    {attempt.correct ? "\u25B2" : "\u25BC"}
                  </span>
                  {/* Problem ID */}
                  <span className="text-sm truncate flex-1 min-w-0 text-[var(--foreground)]">
                    {attempt.source && attempt.sourceNumber
                      ? `${attempt.source} #${attempt.sourceNumber}`
                      : attempt.problemContent.replace(/\$[^$]*\$/g, "[math]").slice(0, 60)}
                  </span>
                  {/* Rating change */}
                  <span
                    className={`text-sm font-bold tabular-nums flex-shrink-0 ${
                      attempt.ratingChange >= 0
                        ? "text-[var(--success)]"
                        : "text-[var(--error)]"
                    }`}
                  >
                    {attempt.ratingChange >= 0 ? "+" : ""}
                    {Math.round(attempt.ratingChange)}
                  </span>
                  {/* Time ago */}
                  <span className="text-[10px] text-[var(--muted)] flex-shrink-0 w-12 text-right">
                    {timeAgo(attempt.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign-in nudge for anonymous users */}
        {!user && !player.isAuthenticated && (
          <div
            className="rounded-xl border border-dashed border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5 animate-fade-in-up"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-sm font-semibold text-[var(--accent)]">Want richer stats?</span>
            </div>
            <p className="text-xs text-[var(--muted)] mb-3">
              Sign in to unlock activity heatmaps, save your progress across devices, and track your improvement over time.
            </p>
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)]/30 transition-colors"
            >
              <GoogleIcon size={16} />
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* Right column: ELO Brackets */}
      <div className="lg:w-64 flex-shrink-0">
        <div
          className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5 animate-slide-in-right sticky top-20"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-4">
            ELO Brackets
          </div>
          <div className="space-y-1.5">
            {[...TIERS].reverse().map((t) => {
              const isCurrent = t.name === tier.name;
              return (
                <div
                  key={t.name}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-300 ${
                    isCurrent
                      ? `${t.bg} ${t.border} border`
                      : "hover:bg-[var(--border)]/20"
                  }`}
                >
                  <div className={`${t.color} flex-shrink-0 tier-icon-glow`} style={{ "--tier-glow": t.hex } as React.CSSProperties}>
                    <TierIcon
                      tier={t.name}
                      size={isCurrent ? 22 : 18}
                      animate={isCurrent}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold truncate ${isCurrent ? t.color : "text-[var(--foreground)]"}`}>
                      {t.name}
                    </div>
                    <div className="text-[10px] text-[var(--muted)] tabular-nums">
                      {t.threshold}+
                    </div>
                  </div>
                  {isCurrent && (
                    <div className={`text-[10px] font-bold ${t.color}`}>
                      YOU
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
