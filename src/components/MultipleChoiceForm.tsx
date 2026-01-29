"use client";

import { useState } from "react";
import { LatexContent } from "./LatexContent";

interface MultipleChoiceFormProps {
  choices: string[];
  onSubmit: (answer: string) => Promise<void>;
  disabled?: boolean;
}

const CHOICE_LETTERS = ["A", "B", "C", "D", "E"];

export function MultipleChoiceForm({
  choices,
  onSubmit,
  disabled = false,
}: MultipleChoiceFormProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (letter: string) => {
    if (submitting || disabled) return;
    setSelected(letter);
  };

  const handleSubmit = async () => {
    if (!selected || submitting || disabled) return;

    setSubmitting(true);
    try {
      await onSubmit(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {choices.map((choice, index) => {
          const letter = CHOICE_LETTERS[index];
          const isSelected = selected === letter;

          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={submitting || disabled}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] hover:border-[var(--accent)]/50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isSelected
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--border)] text-[var(--foreground)]"
                  }`}
                >
                  {letter}
                </span>
                <span className="pt-1 text-base leading-relaxed">
                  <LatexContent content={choice} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selected || disabled || submitting}
        className="w-full py-3 px-6 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit Answer"}
      </button>
    </div>
  );
}
