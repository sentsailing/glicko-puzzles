"use client";

import Link from "next/link";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";

export function HeroCTA() {
  const { user, signInWithGoogle } = useFirebaseAuth();

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/play"
          className="inline-flex items-center gap-2.5 py-3.5 px-10 bg-[var(--btn-primary)] text-[var(--btn-primary-text)] font-semibold text-lg rounded-full hover:bg-[var(--btn-primary-hover)] transition-all hover:scale-105 shadow-lg shadow-black/10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Start Playing
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 py-3.5 px-8 border border-[var(--border)] text-[var(--foreground)] font-semibold text-lg rounded-full hover:bg-[var(--border)]/30 transition-all hover:scale-105"
        >
          <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Leaderboard
        </Link>
      </div>
      {!user && (
        <p className="mt-3 text-sm text-[var(--muted)]">
          <button
            onClick={signInWithGoogle}
            className="text-[var(--accent)] hover:underline font-medium"
          >
            Sign in
          </button>{" "}
          to save your rating and track your progress.
        </p>
      )}
      {user && (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Welcome back! Your progress is saved.
        </p>
      )}
    </>
  );
}
