import Link from "next/link";
import { Header } from "@/components/Header";
import { TierIcon } from "@/components/TierIcon";
import { TIERS } from "@/lib/tiers";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Hero */}
        <div className="text-center max-w-lg mb-12 animate-fade-in-up">
          <div className="flex justify-center mb-5">
            <div className="tier-icon-glow" style={{ "--tier-glow": "#c084fc" } as React.CSSProperties}>
              <TierIcon tier="Icosahedron" size={72} className="text-purple-400 tier-icon-spin" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-3 tracking-tight">PolyPuzzle</h1>
          <p className="text-lg text-[var(--muted)] mb-8">
            Puzzles have ratings too. Can you beat them?
          </p>

          <Link
            href="/play"
            className="inline-flex items-center gap-2.5 py-3.5 px-10 bg-[var(--accent)] text-white font-semibold text-lg rounded-full hover:bg-[var(--accent-hover)] transition-all hover:scale-105 shadow-lg shadow-[var(--accent)]/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Start Playing
          </Link>
          <p className="mt-3 text-sm text-[var(--muted)]">Sign in to save your progress.</p>
        </div>

        {/* Tier Ladder */}
        <div className="w-full max-w-2xl animate-fade-in-up stagger-2">
          <div className="text-center mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--muted)]">
              10 Tiers to Ascend
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line connecting tiers */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)] -translate-x-1/2 hidden md:block" />

            <div className="grid gap-2.5">
              {[...TIERS].reverse().map((tier, i) => {
                const isTop = i === 0;
                const isBottom = i === TIERS.length - 1;
                return (
                  <div
                    key={tier.name}
                    className={`
                      relative flex items-center gap-4 px-5 py-3 rounded-xl border transition-all
                      ${isTop
                        ? `${tier.bg} ${tier.border} border shadow-lg shadow-purple-500/10`
                        : isBottom
                        ? "border-transparent opacity-60"
                        : `border-[var(--border)]/40 hover:${tier.bg} hover:border-[var(--border)]`
                      }
                    `}
                    style={{
                      animationDelay: `${0.3 + i * 0.06}s`,
                    }}
                  >
                    {/* Tier icon */}
                    <div
                      className={`flex-shrink-0 ${tier.color} ${isTop ? "tier-icon-glow tier-icon-spin" : "tier-icon-glow"}`}
                      style={{ "--tier-glow": tier.hex } as React.CSSProperties}
                    >
                      <TierIcon tier={tier.name} size={isTop ? 32 : 26} />
                    </div>

                    {/* Tier info */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${isTop ? "text-base" : "text-sm"} ${tier.color}`}>
                        {tier.name}
                      </div>
                    </div>

                    {/* Rating range */}
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-mono ${isTop ? tier.color : "text-[var(--muted)]"}`}>
                        {tier.threshold === 0 ? "0" : tier.threshold}
                        {tier.nextThreshold < 2800 ? `–${tier.nextThreshold}` : "+"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="text-center mt-8 text-sm text-[var(--muted)]">
            Your ELO rating updates after every problem.
          </div>
        </div>
      </div>
    </main>
  );
}
