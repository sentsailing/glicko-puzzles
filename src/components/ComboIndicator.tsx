"use client";

import { useEffect, useRef, useState } from "react";

interface ComboIndicatorProps {
  combo: number;
}

/**
 * Visual combo counter that appears when combo >= 2.
 * Escalates in intensity: subtle (2-3), medium (4-6), hot (7-9), blazing (10+).
 */
export function ComboIndicator({ combo }: ComboIndicatorProps) {
  const prevCombo = useRef(combo);
  const [animating, setAnimating] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (combo > prevCombo.current && combo >= 2) {
      // Combo increased — pop animation
      setAnimating(true);
      setBroken(false);
      const t = setTimeout(() => setAnimating(false), 300);
      prevCombo.current = combo;
      return () => clearTimeout(t);
    }
    if (combo === 0 && prevCombo.current >= 2) {
      // Combo broken
      setBroken(true);
      const t = setTimeout(() => setBroken(false), 500);
      prevCombo.current = combo;
      return () => clearTimeout(t);
    }
    prevCombo.current = combo;
  }, [combo]);

  if (combo < 2 && !broken) return null;

  // Intensity tiers
  const level =
    combo >= 10 ? "blazing" : combo >= 7 ? "hot" : combo >= 4 ? "medium" : "subtle";

  const sizeClass = {
    subtle: "text-base",
    medium: "text-lg",
    hot: "text-xl",
    blazing: "text-2xl",
  }[level];

  const glowClass = {
    subtle: "",
    medium: "combo-glow-medium",
    hot: "combo-glow-hot",
    blazing: "combo-glow-blazing",
  }[level];

  if (broken) {
    return (
      <div className="flex items-center justify-center animate-combo-break">
        <span className="text-sm font-bold text-[var(--error)] opacity-60">
          Combo broken
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-1.5 ${glowClass} ${
        animating ? "animate-combo-pop" : ""
      }`}
    >
      <span className={`${sizeClass} font-black tabular-nums`}>
        <span className="combo-fire">{combo >= 7 ? "\u{1F525}" : "\u26A1"}</span>
        {" \u00D7 "}
        {combo}
      </span>
      {combo >= 10 && (
        <span className="text-xs font-bold uppercase tracking-widest text-orange-400 animate-pulse">
          UNSTOPPABLE
        </span>
      )}
    </div>
  );
}
