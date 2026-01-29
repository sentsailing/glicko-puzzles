"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ResultCard } from "@/components/ResultCard";
import { useSession } from "@/hooks/useSession";
import type { AttemptResponse } from "@/types";

export default function ResultPage() {
  const router = useRouter();
  const { player, loading: sessionLoading } = useSession();
  const [attempt, setAttempt] = useState<AttemptResponse | null>(null);

  useEffect(() => {
    // Get result from sessionStorage
    const stored = sessionStorage.getItem("lastAttempt");
    if (stored) {
      try {
        setAttempt(JSON.parse(stored));
      } catch {
        router.replace("/play");
      }
    } else {
      router.replace("/play");
    }
  }, [router]);

  if (sessionLoading || !attempt) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header showNav={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--muted)]">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header rating={player?.rating} />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          <ResultCard
            correct={attempt.correct}
            correctAnswer={attempt.correctAnswer}
            ratingBefore={attempt.ratingBefore}
            ratingAfter={attempt.ratingAfter}
            ratingChange={attempt.ratingChange}
          />

          <div className="flex gap-4">
            <Link
              href="/play"
              className="flex-1 py-3 px-6 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors text-center"
            >
              Next Problem
            </Link>
            <Link
              href="/stats"
              className="py-3 px-6 border border-[var(--border)] font-medium rounded-lg hover:bg-[var(--border)] transition-colors text-center"
            >
              View Stats
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
