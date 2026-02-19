"use client";

import { LatexContent } from "./LatexContent";

interface ProblemProps {
  content: string;
  source?: string | null;
  sourceNumber?: number | null;
}

export function Problem({ content, source, sourceNumber }: ProblemProps) {
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

      <div className="text-2xl font-medium leading-normal">
        <LatexContent content={content} />
      </div>
    </div>
  );
}
