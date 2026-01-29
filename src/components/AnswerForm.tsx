"use client";

import { useState, FormEvent } from "react";

interface AnswerFormProps {
  onSubmit: (answer: string) => Promise<void>;
  disabled?: boolean;
}

export function AnswerForm({ onSubmit, disabled = false }: AnswerFormProps) {
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
        className="w-full py-3 px-6 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Submit Answer"}
      </button>
    </form>
  );
}
