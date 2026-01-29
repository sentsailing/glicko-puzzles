"use client";

interface ResultCardProps {
  correct: boolean;
  correctAnswer: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

export function ResultCard({
  correct,
  correctAnswer,
  ratingBefore,
  ratingAfter,
  ratingChange,
}: ResultCardProps) {
  const changeColor = ratingChange >= 0 ? "text-[var(--success)]" : "text-[var(--error)]";
  const changePrefix = ratingChange >= 0 ? "+" : "";

  return (
    <div className="space-y-6">
      <div
        className={`text-center p-6 rounded-lg ${
          correct
            ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
        }`}
      >
        <div
          className={`text-3xl font-bold mb-2 ${
            correct ? "text-[var(--success)]" : "text-[var(--error)]"
          }`}
        >
          {correct ? "Correct!" : "Incorrect"}
        </div>

        {!correct && (
          <div className="text-[var(--muted)]">
            The correct answer was: <span className="font-medium text-[var(--foreground)]">{correctAnswer}</span>
          </div>
        )}
      </div>

      <div className="border border-[var(--border)] rounded-lg p-4">
        <div className="text-sm text-[var(--muted)] mb-3">Rating Change</div>

        <div className="flex items-center justify-center gap-4">
          <span className="text-xl">{Math.round(ratingBefore)}</span>
          <span className="text-[var(--muted)]">&rarr;</span>
          <span className="text-xl font-bold">{Math.round(ratingAfter)}</span>
          <span className={`text-lg font-medium ${changeColor}`}>
            ({changePrefix}{Math.round(ratingChange)})
          </span>
        </div>
      </div>
    </div>
  );
}
