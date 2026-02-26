"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TierIcon } from "./TierIcon";
import type { ApiResponse, CheckUsernameResponse, SetUsernameResponse } from "@/types";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

interface UsernameModalProps {
  fetchWithSession: (url: string, options?: RequestInit) => Promise<Response>;
  onComplete: () => void;
}

export function UsernameModal({ fetchWithSession, onComplete }: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatError = (() => {
    if (!username) return null;
    if (username.length < 3) return "Too short (min 3)";
    if (username.length > 20) return "Too long (max 20)";
    if (!USERNAME_REGEX.test(username)) return "Letters, numbers, and underscores only";
    return null;
  })();

  const isFormatValid = username.length >= 3 && USERNAME_REGEX.test(username);

  const checkAvailability = useCallback(
    async (name: string) => {
      if (!USERNAME_REGEX.test(name)) return;
      setChecking(true);
      try {
        const res = await fetch(
          `/api/player/username/check?username=${encodeURIComponent(name)}`
        );
        const result: ApiResponse<CheckUsernameResponse> = await res.json();
        if (result.success && result.data) {
          setAvailable(result.data.available);
        }
      } catch {
        // Silently fail — user can still submit
      } finally {
        setChecking(false);
      }
    },
    []
  );

  useEffect(() => {
    setAvailable(null);
    setError(null);

    if (!isFormatValid) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkAvailability(username), 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, isFormatValid, checkAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormatValid || available === false || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetchWithSession("/api/player/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName: displayName || undefined,
        }),
      });
      const result: ApiResponse<SetUsernameResponse> = await res.json();

      if (result.success) {
        onComplete();
      } else {
        setError(result.error || "Failed to set username");
        if (result.error === "Username already taken") {
          setAvailable(false);
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = isFormatValid && available === true && !submitting;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md mx-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-2xl animate-fade-in-up"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="tier-icon-glow mb-3" style={{ "--tier-glow": "#f43f5e" } as React.CSSProperties}>
            <TierIcon tier="Dodecahedron" size={48} className="text-rose-500" animate />
          </div>
          <h2 className="text-2xl font-bold">Welcome to PolyPuzzle!</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Choose a username to get started
          </p>
        </div>

        {/* Username field */}
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Username <span className="text-[var(--error)]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">@</span>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              maxLength={20}
              placeholder="your_username"
              className="w-full pl-8 pr-10 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--accent)] transition-colors"
              autoComplete="off"
            />
            {/* Status indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && (
                <svg className="w-4 h-4 text-[var(--muted)] animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
              )}
              {!checking && isFormatValid && available === true && (
                <svg className="w-4 h-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!checking && isFormatValid && available === false && (
                <svg className="w-4 h-4 text-[var(--error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          {/* Validation message */}
          <div className="h-4 text-xs">
            {formatError && (
              <span className="text-[var(--error)]">{formatError}</span>
            )}
            {!formatError && isFormatValid && available === true && (
              <span className="text-[var(--success)]">Available</span>
            )}
            {!formatError && isFormatValid && available === false && (
              <span className="text-[var(--error)]">Already taken</span>
            )}
          </div>
        </div>

        {/* Display name field (optional) */}
        <div className="space-y-1.5 mb-6">
          <label className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            Display Name <span className="text-[var(--muted)]">(optional)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            placeholder="Your name"
            className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 text-sm text-[var(--error)] text-center">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 px-6 bg-[var(--btn-primary)] text-[var(--btn-primary-text)] font-semibold rounded-full hover:bg-[var(--btn-primary-hover)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            "Setting up..."
          ) : (
            <>
              Continue
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
