"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { Problem } from "@/components/Problem";
import { AnswerForm } from "@/components/AnswerForm";
import { MultipleChoiceForm } from "@/components/MultipleChoiceForm";
import { RatingSidebar } from "@/components/RatingSidebar";
import { ReportButton } from "@/components/ReportButton";
import { useSession } from "@/hooks/useSession";
import type { ProblemResponse, AttemptResponse, ApiResponse } from "@/types";

interface SessionEntry {
  rating: number;
  correct: boolean;
}

/** Simple client-side answer check for retry attempts (no rating impact). */
function checkAnswerClient(submitted: string, correct: string): boolean {
  const normalize = (s: string) => {
    let n = s.trim().toLowerCase();
    const num = parseFloat(n);
    if (!isNaN(num)) n = String(num);
    return n;
  };
  return normalize(submitted) === normalize(correct);
}

export default function PlayPage() {
  const { player, loading: sessionLoading, error: sessionError, fetchWithSession, refreshPlayer, initSession } = useSession();
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline feedback state
  const [attemptResult, setAttemptResult] = useState<AttemptResponse | null>(null);
  const [solved, setSolved] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const initialFetchDone = useRef(false);

  // Session history for chart
  const [startingRating, setStartingRating] = useState<number | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);
  const startingRatingSet = useRef(false);

  // Load session history from sessionStorage on mount
  useEffect(() => {
    const storedHistory = sessionStorage.getItem("sessionHistory");
    if (storedHistory) {
      try { setSessionHistory(JSON.parse(storedHistory)); } catch { /* ignore */ }
    }
    const storedStart = sessionStorage.getItem("startingRating");
    if (storedStart) {
      setStartingRating(parseFloat(storedStart));
      startingRatingSet.current = true;
    }
  }, []);

  // Set starting rating when player first loads (if not from storage)
  useEffect(() => {
    if (player && !startingRatingSet.current) {
      startingRatingSet.current = true;
      setStartingRating(player.rating);
      sessionStorage.setItem("startingRating", String(player.rating));
    }
  }, [player]);

  const fetchProblem = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAttemptResult(null);
    setSolved(false);
    setShowAnswer(false);
    setUserAnswer(null);

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
    if (!sessionLoading && player && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchProblem();
    }
  }, [sessionLoading, player, fetchProblem]);

  /** First submission — calls API, affects rating. */
  const handleSubmit = async (answer: string) => {
    if (!problem) return;
    setUserAnswer(answer);

    try {
      const response = await fetchWithSession("/api/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: problem.id, answer }),
      });

      const result: ApiResponse<AttemptResponse> = await response.json();

      if (result.success && result.data) {
        sessionStorage.setItem("lastAttempt", JSON.stringify(result.data));

        // Update session history
        const entry: SessionEntry = { rating: result.data.ratingAfter, correct: result.data.correct };
        setSessionHistory((prev) => {
          const next = [...prev, entry];
          sessionStorage.setItem("sessionHistory", JSON.stringify(next));
          return next;
        });

        setAttemptResult(result.data);
        if (result.data.correct) setSolved(true);
        await refreshPlayer();
      } else {
        setError(result.error || "Failed to submit answer");
      }
    } catch {
      setError("Failed to submit answer");
    }
  };

  /** Retry submission — client-side only, no rating impact. */
  const handleRetry = async (answer: string) => {
    if (!attemptResult) return;

    if (checkAnswerClient(answer, attemptResult.correctAnswer)) {
      setSolved(true);
    } else {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
    setSolved(true);
  };

  // Card border color based on state
  const submitted = attemptResult !== null;
  const cardBorderClass = !submitted
    ? "border-[var(--border)]"
    : solved || showAnswer
      ? "border-green-500"
      : "border-red-500";

  if (sessionLoading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted)]">Loading session...</div>
        </div>
      </main>
    );
  }

  if (sessionError) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-[var(--error)]">{sessionError}</div>
            <button
              onClick={initSession}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)]"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-5 items-start">
          {/* Main problem card */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="text-center text-[var(--muted)] py-20">
                Loading problem...
              </div>
            ) : error ? (
              <div className="text-center space-y-4 py-20">
                <div className="text-[var(--error)]">{error}</div>
                <button
                  onClick={fetchProblem}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : problem ? (
              <div
                key={problem.id}
                className={`relative rounded-xl border ${cardBorderClass} bg-[var(--card-bg)] p-6 sm:p-8 animate-fade-in-up transition-colors duration-300 ${shaking ? "animate-shake" : ""}`}
                style={{ boxShadow: "var(--card-shadow)" }}
              >
                <div className="absolute top-3 right-3">
                  <ReportButton problemId={problem.id} fetchWithSession={fetchWithSession} />
                </div>
                <div className="space-y-6">
                  <Problem content={problem.content} selectable={submitted} />

                  {/* Answer form / result display */}
                  {!submitted ? (
                    /* First attempt — interactive form */
                    problem.answerType === "MULTIPLE_CHOICE" ? (
                      <MultipleChoiceForm choices={problem.choices} onSubmit={handleSubmit} />
                    ) : (
                      <AnswerForm onSubmit={handleSubmit} />
                    )
                  ) : solved ? (
                    /* Solved — show colored choices + Next button */
                    <div className="space-y-4">
                      {problem.answerType === "MULTIPLE_CHOICE" && userAnswer && (
                        <MultipleChoiceForm
                          choices={problem.choices}
                          onSubmit={handleSubmit}
                          resultMode={{
                            correctAnswer: attemptResult.correctAnswer,
                            userAnswer: userAnswer,
                          }}
                        />
                      )}
                      <button
                        onClick={fetchProblem}
                        className="w-full py-3 px-6 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Next Problem
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </button>
                    </div>
                  ) : (
                    /* Wrong, not yet solved — retry form */
                    <div className="space-y-3">
                      {problem.answerType === "MULTIPLE_CHOICE" ? (
                        <MultipleChoiceForm
                          choices={problem.choices}
                          onSubmit={handleRetry}
                          submitLabel="Try Again"
                          wrongAnswer={userAnswer}
                        />
                      ) : (
                        <AnswerForm onSubmit={handleRetry} submitLabel="Try Again" />
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={handleShowAnswer}
                          className="flex-1 py-2 px-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          Show Answer
                        </button>
                        <button
                          onClick={fetchProblem}
                          className="flex-1 py-2 px-4 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center justify-center gap-1.5"
                        >
                          Skip
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          {!loading && !error && problem && (
            <RatingSidebar
              rating={player?.rating}
              lastChange={attemptResult?.ratingChange}
              problemRating={problem.problemRating}
              source={submitted ? problem.source : null}
              sourceNumber={submitted ? problem.sourceNumber : null}
              initialRating={startingRating}
              sessionHistory={sessionHistory}
            />
          )}
        </div>
      </div>
    </main>
  );
}
