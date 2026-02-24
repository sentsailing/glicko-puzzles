"use client";

import { LatexContent } from "./LatexContent";

interface ProblemProps {
  content: string;
  source?: string | null;
  sourceNumber?: number | null;
  /** Whether text is selectable/copyable. Defaults to true. */
  selectable?: boolean;
}

export function Problem({ content, source, sourceNumber, selectable = true }: ProblemProps) {
  const sourceLabel =
    source && sourceNumber ? `${source} #${sourceNumber}` : source || null;

  return (
    <div className="space-y-4">
      {sourceLabel && (
        <div>
          <span className="px-2 py-1 text-xs font-medium rounded bg-[var(--border)]/50 text-[var(--muted)]">
            {sourceLabel}
          </span>
        </div>
      )}

      <div className={`text-2xl font-medium leading-normal ${selectable ? "" : "select-none"}`}>
        <LatexContent content={content} />
      </div>
    </div>
  );
}
