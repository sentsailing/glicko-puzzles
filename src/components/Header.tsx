"use client";

import Link from "next/link";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";

interface HeaderProps {
  rating?: number;
  showNav?: boolean;
}

export function Header({ rating, showNav = true }: HeaderProps) {
  const { user, loading, signInWithGoogle, signOut } = useFirebaseAuth();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold hover:opacity-80">
          Math ELO
        </Link>

        <div className="flex items-center gap-4">
          {rating !== undefined && (
            <span className="text-sm font-medium text-[var(--muted)]">
              Rating: <span className="text-[var(--foreground)]">{Math.round(rating)}</span>
            </span>
          )}

          {showNav && (
            <nav className="flex gap-3">
              <Link
                href="/play"
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Play
              </Link>
              <Link
                href="/stats"
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Stats
              </Link>
            </nav>
          )}

          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)]">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Sign in with Google
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
