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
  { name: "Tetrahedron",          threshold: 0,    nextThreshold: 800,  color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/30",   barColor: "bg-slate-400",   hex: "#94a3b8" },
  { name: "Square Pyramid",       threshold: 800,  nextThreshold: 1000, color: "text-amber-500",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   barColor: "bg-amber-500",   hex: "#f59e0b" },
  { name: "Cube",                 threshold: 1000, nextThreshold: 1200, color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  barColor: "bg-orange-400",  hex: "#fb923c" },
  { name: "Pentagonal Prism",     threshold: 1200, nextThreshold: 1400, color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  barColor: "bg-yellow-400",  hex: "#facc15" },
  { name: "Octahedron",           threshold: 1400, nextThreshold: 1600, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", barColor: "bg-emerald-400", hex: "#34d399" },
  { name: "Heptagonal Prism",     threshold: 1600, nextThreshold: 1800, color: "text-teal-400",    bg: "bg-teal-500/10",    border: "border-teal-500/30",    barColor: "bg-teal-400",    hex: "#2dd4bf" },
  { name: "Square Antiprism",     threshold: 1800, nextThreshold: 2000, color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    barColor: "bg-blue-400",    hex: "#60a5fa" },
  { name: "Dodecahedron",         threshold: 2000, nextThreshold: 2200, color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/30",  barColor: "bg-indigo-400",  hex: "#818cf8" },
  { name: "Hexagonal Antiprism",  threshold: 2200, nextThreshold: 2400, color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  barColor: "bg-violet-400",  hex: "#a78bfa" },
  { name: "Icosahedron",          threshold: 2400, nextThreshold: 2800, color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30",  barColor: "bg-purple-400",  hex: "#c084fc" },
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
