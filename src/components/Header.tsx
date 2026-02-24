"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { TierIcon } from "./TierIcon";

export function Header() {
  const { user, loading, signInWithGoogle, signOut } = useFirebaseAuth();
  const { theme, toggleTheme } = useTheme();
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
          <span className="text-base font-bold tracking-tight">PolyPuzzle</span>
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

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="5" />
              <path strokeLinecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

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
