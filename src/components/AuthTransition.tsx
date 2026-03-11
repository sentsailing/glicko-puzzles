"use client";

import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { TierIcon } from "./TierIcon";

/**
 * Full-screen overlay shown during the auth transition:
 * 1. While the Google sign-in popup is open (signingIn)
 * 2. After auth succeeds but session is still loading (user exists, session loading)
 *
 * Fades out once the session is ready.
 */
export function AuthTransition() {
  const { user, signingIn } = useFirebaseAuth();
  const { loading: sessionLoading } = useSessionContext();

  // Phase: "connecting" (popup open), "loading" (auth done, session init), or null
  const phase = signingIn
    ? "connecting"
    : user && sessionLoading
      ? "loading"
      : null;

  // Track visibility separately for fade-out animation
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (phase) {
      setVisible(true);
      setFading(false);
    } else if (visible) {
      // Start fade-out
      setFading(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center bg-[var(--background)]/95 backdrop-blur-md transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Floating background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            top: "15%",
            left: "10%",
            animation: "authFloat 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            bottom: "20%",
            right: "15%",
            animation: "authFloat 6s ease-in-out infinite 3s",
          }}
        />
        <div
          className="absolute w-32 h-32 rounded-full opacity-[0.02]"
          style={{
            background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
            top: "50%",
            right: "30%",
            animation: "authFloat 8s ease-in-out infinite 1.5s",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Animated icon with glow ring */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, var(--accent) 0%, transparent 60%)",
              opacity: 0.15,
              transform: "scale(2.5)",
              animation: "authPulse 2s ease-in-out infinite",
            }}
          />
          <div
            className="relative text-[var(--accent)]"
            style={{
              filter: "drop-shadow(0 0 20px var(--accent))",
              animation: "authSpin 4s linear infinite",
            }}
          >
            <TierIcon tier="Octahedron" size={64} />
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex flex-col items-center gap-4">
          {/* Step 1: Connecting */}
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              phase === "connecting"
                ? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] scale-110"
                : phase === "loading"
                  ? "bg-[var(--success)]"
                  : "bg-[var(--border)]"
            }`} />
            <span className={`text-sm transition-colors duration-500 ${
              phase === "connecting"
                ? "text-[var(--foreground)] font-medium"
                : phase === "loading"
                  ? "text-[var(--muted)]"
                  : "text-[var(--muted)]"
            }`}>
              Connecting to Google
              {phase === "connecting" && <AnimatedDots />}
            </span>
          </div>

          {/* Step 2: Loading profile */}
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              phase === "loading"
                ? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] scale-110"
                : "bg-[var(--border)]"
            }`} />
            <span className={`text-sm transition-colors duration-500 ${
              phase === "loading"
                ? "text-[var(--foreground)] font-medium"
                : "text-[var(--muted)]/50"
            }`}>
              Loading your profile
              {phase === "loading" && <AnimatedDots />}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Animated "..." that cycles */
function AnimatedDots() {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);
  return <span className="inline-block w-4 text-left">{".".repeat(dots)}</span>;
}
