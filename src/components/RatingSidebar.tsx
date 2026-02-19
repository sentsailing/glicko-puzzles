"use client";

import { getTier, getTierProgress } from "@/lib/tiers";
import { TierIcon } from "./TierIcon";

interface SessionEntry {
  rating: number;
  correct: boolean;
}

interface RatingSidebarProps {
  rating?: number;
  lastChange?: number | null;
  problemRating?: number;
  /** Source/number for AoPS link (only passed after submission). */
  source?: string | null;
  sourceNumber?: number | null;
  /** Starting rating before any attempts this session. */
  initialRating?: number | null;
  /** Array of attempt results for session history chart. */
  sessionHistory?: SessionEntry[];
}

function getAopsUrl(source: string, sourceNumber: number): string {
  const pagePrefix = source.replace(/ /g, "_");
  return `https://artofproblemsolving.com/wiki/index.php/${pagePrefix}_Problems/Problem_${sourceNumber}`;
}

/** Inline SVG chart of rating over the session with gradient fill, labels, and reference line. */
function SessionChart({ ratingPoints, results }: { ratingPoints: number[]; results: boolean[] }) {
  if (ratingPoints.length < 2) return null;

  const W = 240;
  const H = 90;
  const PAD_X = 6;
  const PAD_Y = 10;

  const min = Math.min(...ratingPoints);
  const max = Math.max(...ratingPoints);
  const padding = Math.max((max - min) * 0.15, 5);
  const yMin = min - padding;
  const yMax = max + padding;
  const yRange = yMax - yMin;

  const startRating = ratingPoints[0];
  const startY = H - PAD_Y - ((startRating - yMin) / yRange) * (H - 2 * PAD_Y);

  const points = ratingPoints.map((r, i) => ({
    x: PAD_X + (i / (ratingPoints.length - 1)) * (W - 2 * PAD_X),
    y: H - PAD_Y - ((r - yMin) / yRange) * (H - 2 * PAD_Y),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Gradient fill below line
  const fillPath = `M${points[0].x},${points[0].y} ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

  const lastRating = ratingPoints[ratingPoints.length - 1];
  const delta = lastRating - startRating;
  const isUp = delta >= 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "90px" }}>
      <defs>
        <linearGradient id="sessionGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isUp ? "var(--success)" : "var(--error)"} stopOpacity={0.15} />
          <stop offset="100%" stopColor={isUp ? "var(--success)" : "var(--error)"} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Start rating reference line */}
      <line
        x1={PAD_X}
        y1={startY}
        x2={W - PAD_X}
        y2={startY}
        stroke="var(--muted)"
        strokeWidth="0.5"
        strokeDasharray="3,3"
        opacity={0.4}
      />
      {/* Start label */}
      <text x={PAD_X} y={startY - 3} fill="var(--muted)" fontSize="7" opacity={0.6}>
        {Math.round(startRating)}
      </text>
      {/* Fill under line */}
      <path d={fillPath} fill="url(#sessionGrad)" />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Start point */}
      <circle cx={points[0].x} cy={points[0].y} r={2} fill="var(--muted)" opacity={0.5} />
      {/* Data points with correct/incorrect colors */}
      {points.slice(1).map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 2 ? 4 : 2.5}
          fill={results[i] ? "var(--success)" : "var(--error)"}
        />
      ))}
      {/* Current rating label at last point */}
      <text
        x={points[points.length - 1].x}
        y={points[points.length - 1].y - 5}
        fill={isUp ? "var(--success)" : "var(--error)"}
        fontSize="8"
        fontWeight="bold"
        textAnchor="middle"
      >
        {Math.round(lastRating)}
      </text>
    </svg>
  );
}

/** Row of colored arrows showing correct/wrong sequence. Most recent is prominent. */
function ResultArrows({ results }: { results: boolean[] }) {
  if (results.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {results.map((correct, i) => {
        const isLast = i === results.length - 1;
        return (
          <span
            key={i}
            className={`inline-flex items-center justify-center leading-none ${
              correct ? "text-[var(--success)]" : "text-[var(--error)]"
            } ${
              isLast ? "text-sm font-bold" : "text-[10px] opacity-50"
            }`}
          >
            {correct ? "\u25B2" : "\u25BC"}
          </span>
        );
      })}
    </div>
  );
}

export function RatingSidebar({
  rating,
  lastChange,
  problemRating,
  source,
  sourceNumber,
  initialRating,
  sessionHistory = [],
}: RatingSidebarProps) {
  const currentRating = rating ?? 1500;
  const tier = getTier(currentRating);
  const progressPercent = getTierProgress(currentRating);

  const aopsUrl = source && sourceNumber ? getAopsUrl(source, sourceNumber) : null;

  // Chart data
  const startRating = initialRating ?? currentRating;
  const ratingPoints = [startRating, ...sessionHistory.map((h) => h.rating)];
  const results = sessionHistory.map((h) => h.correct);

  return (
    <div className="flex flex-row lg:flex-col gap-3 lg:w-64">
      {/* Player Rating Card */}
      <div
        className={`flex-1 rounded-xl border ${tier.border} ${tier.bg} p-4 animate-slide-in-right`}
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
          Your Rating
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tabular-nums">
            {Math.round(currentRating)}
          </span>
          {lastChange != null && (
            <span
              className={`text-lg font-bold tabular-nums ${
                lastChange >= 0 ? "text-[var(--success)]" : "text-[var(--error)]"
              }`}
            >
              {lastChange >= 0 ? "+" : ""}
              {Math.round(lastChange)}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1.5 mt-1`}>
          <TierIcon tier={tier.name} size={16} className={tier.color} animate />
          <span className={`text-sm font-semibold ${tier.color}`}>{tier.name}</span>
        </div>
        {/* Progress to next tier */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-[var(--muted)] mb-1 tabular-nums">
            <span>{tier.threshold}</span>
            <span>{tier.nextThreshold}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full ${tier.barColor} transition-all duration-700 ease-out`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Problem Rating Card */}
      {problemRating != null && (
        <div
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 animate-slide-in-right stagger-2"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
            Problem Rating
          </div>
          <div className="text-3xl font-bold tabular-nums">
            {Math.round(problemRating)}
          </div>
        </div>
      )}

      {/* Session History Card */}
      <div
        className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 animate-slide-in-right stagger-3"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Session
          </div>
          {results.length > 0 && (
            <div className="text-[10px] tabular-nums text-[var(--muted)]">
              {results.filter(Boolean).length}W {results.filter((r) => !r).length}L
            </div>
          )}
        </div>
        {ratingPoints.length >= 2 ? (
          <div className="space-y-2">
            <SessionChart ratingPoints={ratingPoints} results={results} />
            <div className="flex items-center justify-between">
              <ResultArrows results={results} />
              {(() => {
                const delta = ratingPoints[ratingPoints.length - 1] - ratingPoints[0];
                const isUp = delta >= 0;
                return (
                  <span className={`text-xs font-bold tabular-nums ${isUp ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                    {isUp ? "+" : ""}{Math.round(delta)}
                  </span>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--muted)]">Play to see history!</div>
        )}
      </div>

      {/* AoPS Solution Link Card */}
      {aopsUrl && (
        <a
          href={aopsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 animate-fade-in-up hover:border-[var(--accent)]/50 hover:shadow-sm transition-all duration-200 group"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">
            Solution
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors">
              View on AoPS
            </span>
            <svg className="w-4 h-4 text-[var(--accent)] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </a>
      )}
    </div>
  );
}
