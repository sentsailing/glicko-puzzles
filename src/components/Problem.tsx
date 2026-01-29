"use client";

import { LatexContent } from "./LatexContent";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

interface ProblemProps {
  content: string;
  difficulty: Difficulty;
}

const difficultyStyles: Record<Difficulty, string> = {
  EASY: "rating-easy",
  MEDIUM: "rating-medium",
  HARD: "rating-hard",
};

const difficultyLabels: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export function Problem({ content, difficulty }: ProblemProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${difficultyStyles[difficulty]}`}
        >
          {difficultyLabels[difficulty]}
        </span>
      </div>

      <div className="text-2xl font-medium leading-relaxed">
        <LatexContent content={content} />
      </div>
    </div>
  );
}
