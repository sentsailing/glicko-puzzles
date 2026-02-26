"use client";

import { useEffect, useState } from "react";
import { TIERS } from "@/lib/tiers";
import { TierIcon } from "./TierIcon";
import type { TierChange } from "@/types";

interface TierUpCelebrationProps {
  tierChange: TierChange;
  onDismiss: () => void;
}

/**
 * Full-screen overlay celebrating a tier promotion.
 * Auto-dismisses after 4 seconds or on click.
 */
export function TierUpCelebration({ tierChange, onDismiss }: TierUpCelebrationProps) {
  const [visible, setVisible] = useState(false);

  const newTier = TIERS.find((t) => t.name === tierChange.newTier) ?? TIERS[0];

  useEffect(() => {
    // Trigger entrance animation after mount
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="confetti-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              backgroundColor: [newTier.hex, "#facc15", "#60a5fa", "#f472b6", "#34d399"][i % 5],
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-4 animate-celebration-pop">
        {/* Tier icon with glow */}
        <div
          className={`${newTier.color} celebration-icon-glow`}
          style={{ "--celebration-glow": newTier.hex } as React.CSSProperties}
        >
          <TierIcon tier={newTier.name} size={96} animate />
        </div>

        {/* Text */}
        <div className="text-center">
          <div
            className="text-3xl sm:text-4xl font-black uppercase tracking-wider mb-2"
            style={{ color: newTier.hex }}
          >
            Promoted!
          </div>
          <div className="text-lg text-white/80 font-medium">
            <span className="text-white/50">{tierChange.oldTier}</span>
            {" \u2192 "}
            <span style={{ color: newTier.hex }} className="font-bold">
              {tierChange.newTier}
            </span>
          </div>
        </div>

        <div className="text-xs text-white/40 mt-4">tap to dismiss</div>
      </div>
    </div>
  );
}

interface DemotionToastProps {
  tierChange: TierChange;
  onDismiss: () => void;
}

/**
 * Subdued toast notification for tier demotion.
 * Auto-dismisses after 3 seconds.
 */
export function DemotionToast({ tierChange, onDismiss }: DemotionToastProps) {
  const [visible, setVisible] = useState(false);

  const newTier = TIERS.find((t) => t.name === tierChange.newTier) ?? TIERS[0];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] shadow-lg">
        <TierIcon tier={newTier.name} size={18} className={newTier.color} />
        <span className="text-sm text-[var(--muted)]">
          Tier changed to <span className={`font-semibold ${newTier.color}`}>{tierChange.newTier}</span>
        </span>
      </div>
    </div>
  );
}
