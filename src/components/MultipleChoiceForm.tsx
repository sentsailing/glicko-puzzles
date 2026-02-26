"use client";

import { useState, useLayoutEffect, useRef } from "react";
import { LatexContent } from "./LatexContent";

interface MultipleChoiceFormProps {
  choices: string[];
  onSubmit: (answer: string) => Promise<void>;
  disabled?: boolean;
  submitLabel?: string;
  /** When set, shows choices in read-only result mode with coloring. */
  resultMode?: {
    correctAnswer: string;
    userAnswer: string;
  };
  /** Highlights a previously wrong answer during retry. */
  wrongAnswer?: string | null;
}

const CHOICE_LETTERS = ["A", "B", "C", "D", "E"];

export function MultipleChoiceForm({
  choices,
  onSubmit,
  disabled = false,
  submitLabel = "Submit Answer",
  resultMode,
  wrongAnswer,
}: MultipleChoiceFormProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVertical, setIsVertical] = useState(false);

  const hasText = choices.length > 0;
  const items = hasText ? choices : CHOICE_LETTERS;

  // Measure whether choices fit in one horizontal row before paint.
  // Also detect if any individual choice text wraps (e.g. "$B = W$" splitting
  // after the "=" sign), which looks broken in horizontal layout.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !hasText) {
      setIsVertical(false);
      return;
    }

    // Temporarily force horizontal no-wrap to measure natural width
    el.style.flexDirection = "row";
    el.style.flexWrap = "nowrap";

    // Also force choice text spans to not wrap, so overflow is detectable
    const textSpans = el.querySelectorAll<HTMLElement>(".choice-text");
    for (const span of textSpans) {
      span.style.whiteSpace = "nowrap";
    }

    let shouldStack = el.scrollWidth > el.clientWidth;

    // Check if any individual button's text overflows its container
    if (!shouldStack) {
      for (const span of textSpans) {
        if (span.scrollWidth > span.clientWidth + 1) {
          shouldStack = true;
          break;
        }
      }
    }

    // Revert inline overrides so class-based styles take effect
    el.style.flexDirection = "";
    el.style.flexWrap = "";
    for (const span of textSpans) {
      span.style.whiteSpace = "";
    }

    setIsVertical(shouldStack);
  }, [items, hasText]);

  const handleSelect = (letter: string) => {
    if (submitting || disabled || resultMode) return;
    setSelected(letter);
  };

  const handleSubmit = async () => {
    if (!selected || submitting || disabled || resultMode) return;

    setSubmitting(true);
    try {
      await onSubmit(selected);
    } finally {
      setSubmitting(false);
      setSelected(null);
    }
  };

  function getButtonClass(letter: string): string {
    if (resultMode) {
      const isCorrect = letter === resultMode.correctAnswer;
      const isUserWrong =
        letter === resultMode.userAnswer &&
        letter !== resultMode.correctAnswer;
      if (isCorrect) return "border-green-500 bg-green-500/10";
      if (isUserWrong) return "border-red-500 bg-red-500/10";
      return "border-[var(--border)] opacity-50";
    }
    if (selected === letter)
      return "border-[var(--accent)] bg-[var(--accent)]/10 shadow-md scale-[1.01]";
    if (wrongAnswer === letter)
      return "border-red-400/50 bg-red-500/5 hover:border-[var(--accent)]/50 hover:shadow-sm hover:scale-[1.01]";
    return "border-[var(--border)] hover:border-[var(--accent)]/50 hover:shadow-sm hover:scale-[1.01]";
  }

  function getCircleClass(letter: string): string {
    if (resultMode) {
      const isCorrect = letter === resultMode.correctAnswer;
      const isUserWrong =
        letter === resultMode.userAnswer &&
        letter !== resultMode.correctAnswer;
      if (isCorrect) return "bg-green-500 text-white";
      if (isUserWrong) return "bg-red-500 text-white";
      return "bg-[var(--border)] text-[var(--foreground)]";
    }
    if (selected === letter) return "bg-[var(--accent)] text-white";
    if (wrongAnswer === letter) return "bg-red-400 text-white";
    return "bg-[var(--border)] text-[var(--foreground)]";
  }

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className={`flex gap-3 ${isVertical ? "flex-col" : "flex-row"}`}
      >
        {items.map((item, index) => {
          const letter = CHOICE_LETTERS[index];

          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={submitting || disabled || !!resultMode}
              className={`text-left px-4 py-3 rounded-lg border transition-all duration-200 ${
                hasText ? "" : "flex-1"
              } ${getButtonClass(letter)} ${resultMode ? "cursor-default" : ""} disabled:cursor-not-allowed`}
            >
              <div className={`flex items-center ${hasText ? "" : "justify-center"} gap-3`}>
                <span
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${getCircleClass(letter)}`}
                >
                  {letter}
                </span>
                {hasText && (
                  <span className="choice-text text-xl leading-relaxed">
                    <LatexContent content={item} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!resultMode && (
        <button
          onClick={handleSubmit}
          disabled={!selected || disabled || submitting}
          className={`w-full py-3 px-6 bg-[var(--btn-primary)] text-[var(--btn-primary-text)] font-medium rounded-lg hover:bg-[var(--btn-primary-hover)] hover:scale-[1.01] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            selected && !submitting ? "animate-pulse-subtle" : ""
          }`}
        >
          {submitting ? "Submitting..." : (
            <>
              {submitLabel === "Try Again" ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              )}
              {submitLabel}
            </>
          )}
        </button>
      )}
    </div>
  );
}
