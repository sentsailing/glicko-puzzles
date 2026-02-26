"use client";

interface DifficultyBreakdownProps {
  breakdown: {
    easy: { total: number; correct: number };
    medium: { total: number; correct: number };
    hard: { total: number; correct: number };
  };
}

const LEVELS = [
  { key: "easy" as const, label: "Easy", color: "bg-[var(--success)]", textColor: "text-[var(--success)]" },
  { key: "medium" as const, label: "Medium", color: "bg-yellow-500", textColor: "text-yellow-500" },
  { key: "hard" as const, label: "Hard", color: "bg-[var(--error)]", textColor: "text-[var(--error)]" },
];

export function DifficultyBreakdown({ breakdown }: DifficultyBreakdownProps) {
  return (
    <div className="space-y-3">
      {LEVELS.map(({ key, label, color, textColor }) => {
        const { total, correct } = breakdown[key];
        const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
              <span className="text-xs text-[var(--muted)] tabular-nums">
                {correct}/{total} ({pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className={`h-full rounded-full ${color} transition-all duration-700`}
                style={{ width: total > 0 ? `${pct}%` : "0%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
