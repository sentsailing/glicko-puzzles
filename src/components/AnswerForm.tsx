"use client";

import { useState, FormEvent } from "react";

interface AnswerFormProps {
  onSubmit: (answer: string) => Promise<void>;
  disabled?: boolean;
  submitLabel?: string;
}

export function AnswerForm({ onSubmit, disabled = false, submitLabel = "Submit Answer" }: AnswerFormProps) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitting || disabled) return;

    setSubmitting(true);
    try {
      await onSubmit(answer.trim());
    } finally {
      setSubmitting(false);
      setAnswer("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="answer" className="block text-sm font-medium mb-2">
          Your Answer
        </label>
        <input
          type="text"
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled || submitting}
          placeholder="Enter your answer"
          autoComplete="off"
          autoFocus
          className="w-full px-4 py-3 text-lg border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={!answer.trim() || disabled || submitting}
        className="w-full py-3 px-6 bg-[var(--btn-primary)] text-[var(--btn-primary-text)] font-medium rounded-lg hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </form>
  );
}
