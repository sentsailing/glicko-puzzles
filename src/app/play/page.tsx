"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Problem } from "@/components/Problem";
import { AnswerForm } from "@/components/AnswerForm";
import { MultipleChoiceForm } from "@/components/MultipleChoiceForm";
import { useSession } from "@/hooks/useSession";
import type { ProblemResponse, AttemptResponse, ApiResponse } from "@/types";

export default function PlayPage() {
  const router = useRouter();
  const { player, loading: sessionLoading, fetchWithSession, refreshPlayer } = useSession();
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProblem = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchWithSession("/api/problem/next");
      const result: ApiResponse<ProblemResponse> = await response.json();

      if (result.success && result.data) {
        setProblem(result.data);
      } else {
        setError(result.error || "Failed to load problem");
      }
    } catch {
      setError("Failed to load problem");
    } finally {
      setLoading(false);
    }
  }, [fetchWithSession]);

  useEffect(() => {
    if (!sessionLoading && player) {
      fetchProblem();
    }
  }, [sessionLoading, player, fetchProblem]);

  const handleSubmit = async (answer: string) => {
    if (!problem) return;

    try {
      const response = await fetchWithSession("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, answer }),
      });

      const result: ApiResponse<AttemptResponse> = await response.json();

      if (result.success && result.data) {
        // Store result in sessionStorage for result page
        sessionStorage.setItem("lastAttempt", JSON.stringify(result.data));
        await refreshPlayer();
        router.push("/play/result");
      } else {
        setError(result.error || "Failed to submit answer");
      }
    } catch {
      setError("Failed to submit answer");
    }
  };

  if (sessionLoading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header showNav={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted)]">Loading session...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header rating={player?.rating} />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="text-center text-[var(--muted)]">
              Loading problem...
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="text-[var(--error)]">{error}</div>
              <button
                onClick={fetchProblem}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)]"
              >
                Try Again
              </button>
            </div>
          ) : problem ? (
            <div className="space-y-8">
              <Problem content={problem.content} difficulty={problem.difficulty} />
              {problem.answerType === "MULTIPLE_CHOICE" ? (
                <MultipleChoiceForm
                  choices={problem.choices}
                  onSubmit={handleSubmit}
                />
              ) : (
                <AnswerForm onSubmit={handleSubmit} />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
