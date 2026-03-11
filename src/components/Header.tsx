"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { GoogleIcon } from "./GoogleIcon";
import { TierIcon } from "./TierIcon";

export function Header() {
  const { user, loading, signingIn, signInError, signInWithGoogle, signOut } = useFirebaseAuth();
  const { player } = useSessionContext();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const displayUsername = player?.username || user?.displayName || user?.email || "User";

  return (
    <div className="sticky top-3 z-50 flex justify-center px-4">
      <nav
        className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-[var(--border)]/50 bg-[var(--background)]/80 backdrop-blur-lg shadow-lg"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-[var(--border)]/30 transition-colors"
        >
          <TierIcon tier="Octahedron" size={22} className="text-[var(--accent)]" />
          <span className="text-base font-bold tracking-tight">GLICKGLICK</span>
        </Link>

        <div className="w-px h-5 bg-[var(--border)]/50 mx-1.5" />

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
        <Link
          href="/leaderboard"
          className={`px-4 py-1.5 text-base font-medium rounded-full transition-colors flex items-center gap-1.5 ${
            pathname === "/leaderboard"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30"
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="hidden sm:inline">Leaderboard</span>
        </Link>

        <div className="w-px h-5 bg-[var(--border)]/50 mx-1.5" />

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

        <div className="w-px h-5 bg-[var(--border)]/50 mx-1" />

        {/* Auth */}
        {!loading && (
          user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-base hover:bg-[var(--border)]/30 transition-colors"
              >
                <span className="max-w-[120px] truncate text-sm font-medium">
                  {player?.username ? `@${player.username}` : displayUsername}
                </span>
                <svg className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-lg py-1 z-50">
                  <Link
                    href="/stats"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 border-b border-[var(--border)] hover:bg-[var(--border)]/30 transition-colors"
                  >
                    {player?.username && (
                      <div className="text-sm font-semibold">@{player.username}</div>
                    )}
                    <div className="text-xs text-[var(--muted)] truncate">{user.email}</div>
                  </Link>
                  <button
                    onClick={() => { setDropdownOpen(false); signOut(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={signInWithGoogle}
                disabled={signingIn}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-sm font-medium transition-colors shadow-sm ${
                  signingIn
                    ? "bg-[var(--accent)]/70 cursor-wait"
                    : "bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                }`}
              >
                {signingIn ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <GoogleIcon size={16} />
                )}
                {signingIn ? "Signing in\u2026" : "Sign in"}
              </button>
              {signInError && (
                <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-lg border border-red-500/50 bg-[var(--background)] text-xs text-red-400 shadow-lg z-50">
                  {signInError}
                </div>
              )}
            </div>
          )
        )}
      </nav>
    </div>
  );
}
