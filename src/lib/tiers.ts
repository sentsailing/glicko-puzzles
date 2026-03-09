export interface Tier {
  name: string;
  /** Minimum rating for this tier (inclusive). */
  threshold: number;
  /** Minimum rating for the next tier. */
  nextThreshold: number;
  /** Tailwind text color class. */
  color: string;
  /** Tailwind bg color class (low opacity). */
  bg: string;
  /** Tailwind border color class (low opacity). */
  border: string;
  /** Tailwind progress bar fill class. */
  barColor: string;
  /** CSS color value for SVG stroke/fill. */
  hex: string;
}

export const TIERS: Tier[] = [
  { name: "Tetrahedron",          threshold: 0,    nextThreshold: 800,  color: "text-stone-500",    bg: "bg-stone-500/10",    border: "border-stone-500/30",    barColor: "bg-stone-500",    hex: "#78716c" },
  { name: "Square Pyramid",       threshold: 800,  nextThreshold: 1000, color: "text-amber-700",    bg: "bg-amber-700/10",    border: "border-amber-700/30",    barColor: "bg-amber-700",    hex: "#b45309" },
  { name: "Cube",                 threshold: 1000, nextThreshold: 1200, color: "text-orange-500",   bg: "bg-orange-500/10",   border: "border-orange-500/30",   barColor: "bg-orange-500",   hex: "#f97316" },
  { name: "Pentagonal Prism",     threshold: 1200, nextThreshold: 1400, color: "text-yellow-500",   bg: "bg-yellow-500/10",   border: "border-yellow-500/30",   barColor: "bg-yellow-500",   hex: "#eab308" },
  { name: "Octahedron",           threshold: 1400, nextThreshold: 1600, color: "text-emerald-500",  bg: "bg-emerald-500/10",  border: "border-emerald-500/30",  barColor: "bg-emerald-500",  hex: "#10b981" },
  { name: "Heptagonal Prism",     threshold: 1600, nextThreshold: 1800, color: "text-cyan-500",     bg: "bg-cyan-500/10",     border: "border-cyan-500/30",     barColor: "bg-cyan-500",     hex: "#06b6d4" },
  { name: "Square Antiprism",     threshold: 1800, nextThreshold: 2000, color: "text-blue-500",     bg: "bg-blue-500/10",     border: "border-blue-500/30",     barColor: "bg-blue-500",     hex: "#3b82f6" },
  { name: "Dodecahedron",         threshold: 2000, nextThreshold: 2200, color: "text-rose-500",     bg: "bg-rose-500/10",     border: "border-rose-500/30",     barColor: "bg-rose-500",     hex: "#f43f5e" },
  { name: "Hexagonal Antiprism",  threshold: 2200, nextThreshold: 2400, color: "text-fuchsia-500",  bg: "bg-fuchsia-500/10",  border: "border-fuchsia-500/30",  barColor: "bg-fuchsia-500",  hex: "#d946ef" },
  { name: "Icosahedron",          threshold: 2400, nextThreshold: 2800, color: "text-violet-600",   bg: "bg-violet-600/10",   border: "border-violet-600/30",   barColor: "bg-violet-600",   hex: "#7c3aed" },
];

/** Get the tier for a given rating. */
export function getTier(rating: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (rating >= TIERS[i].threshold) return TIERS[i];
  }
  return TIERS[0];
}

/** Get progress percentage within the current tier (0-100). */
export function getTierProgress(rating: number): number {
  const tier = getTier(rating);
  const range = tier.nextThreshold - tier.threshold;
  const value = rating - tier.threshold;
  return Math.min(100, Math.max(0, (value / range) * 100));
}

/** Number of consecutive problems at a new tier before confirming the change. */
const TIER_CONFIRM_THRESHOLD = 3;

export interface TierChangeResult {
  /** Updated confirmed tier name. */
  confirmedTier: string;
  /** Updated tier streak counter. */
  tierStreak: number;
  /** If a tier change was confirmed this attempt. */
  tierChange?: {
    promoted: boolean;
    newTier: string;
    oldTier: string;
  };
}

/**
 * Determine whether the player's confirmed tier should change.
 *
 * The confirmed tier only changes after the player's live tier has been
 * different from their confirmed tier for TIER_CONFIRM_THRESHOLD consecutive
 * problems. This prevents flickering at tier boundaries.
 */
export function updateConfirmedTier(
  newRating: number,
  currentConfirmedTier: string,
  currentTierStreak: number,
): TierChangeResult {
  const liveTier = getTier(newRating);

  // Still in the same confirmed tier — reset streak
  if (liveTier.name === currentConfirmedTier) {
    return { confirmedTier: currentConfirmedTier, tierStreak: 0 };
  }

  // In a different tier — increment streak
  const newStreak = currentTierStreak + 1;

  if (newStreak >= TIER_CONFIRM_THRESHOLD) {
    // Determine promotion vs demotion
    const oldTierObj = TIERS.find((t) => t.name === currentConfirmedTier) ?? TIERS[0];
    const promoted = liveTier.threshold > oldTierObj.threshold;

    return {
      confirmedTier: liveTier.name,
      tierStreak: 0,
      tierChange: {
        promoted,
        newTier: liveTier.name,
        oldTier: currentConfirmedTier,
      },
    };
  }

  // Not yet confirmed — keep counting
  return { confirmedTier: currentConfirmedTier, tierStreak: newStreak };
}
