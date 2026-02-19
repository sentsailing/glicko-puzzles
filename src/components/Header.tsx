"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { TierIcon } from "./TierIcon";

export function Header() {
  const { user, loading, signInWithGoogle, signOut } = useFirebaseAuth();
  const pathname = usePathname();

  return (
    <div className="sticky top-3 z-50 flex justify-center px-4">
      <nav
        className="flex items-center gap-2 px-3 py-2 rounded-full border border-[var(--border)]/50 bg-[var(--background)]/80 backdrop-blur-lg shadow-lg"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-[var(--border)]/30 transition-colors"
        >
          <TierIcon tier="Octahedron" size={22} className="text-[var(--accent)]" />
          <span className="text-base font-bold tracking-tight">MathELO</span>
        </Link>

        <div className="w-px h-5 bg-[var(--border)]/50 mx-1" />

        {/* Nav links */}
        <Link
          href="/play"
          className={`px-4 py-1.5 text-base font-medium rounded-full transition-colors ${
            pathname === "/play"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30"
          }`}
        >
          Play
        </Link>
        <Link
          href="/stats"
          className={`px-4 py-1.5 text-base font-medium rounded-full transition-colors ${
            pathname === "/stats"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30"
          }`}
        >
          Stats
        </Link>

        <div className="w-px h-5 bg-[var(--border)]/50 mx-1" />

        {/* Auth */}
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-base text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                {(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">
                {user.displayName || user.email}
              </span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="px-4 py-1.5 rounded-full text-base font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
            >
              Sign in
            </button>
          )
        )}
      </nav>
    </div>
  );
}
