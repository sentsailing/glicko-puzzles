import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { HeroCTA } from "@/components/HeroCTA";
import { TierIcon } from "@/components/TierIcon";
import { TIERS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "GLICKGLICK — Rating-Based Math Practice",
};

export default function HomePage() {
  const tiersDesc = [...TIERS].reverse();

  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-16 gap-16">
        {/* Hero */}
        <div className="text-center animate-fade-in-up">
          <div className="relative flex justify-center mb-8">
            <div className="absolute w-40 h-40 bg-[var(--accent)]/10 blur-3xl rounded-full" />
            <div
              className="relative tier-icon-glow"
              style={{ "--tier-glow": "#2563eb" } as React.CSSProperties}
            >
              <TierIcon tier="Icosahedron" size={96} className="text-blue-600" animate />
            </div>
          </div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight mb-4">
            GLICKGLICK
          </h1>
          <p className="text-xl text-[var(--muted)] mb-10">
            Math puzzles that fight back.
          </p>
          <HeroCTA />
        </div>

        {/* Tier Grid */}
        <div className="w-full max-w-3xl animate-fade-in-up stagger-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {tiersDesc.map((tier, i) => {
              const isElite = i < 3;
              return (
                <div
                  key={tier.name}
                  className={`group flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border transition-all duration-200 cursor-default
                    ${isElite
                      ? `${tier.bg} ${tier.border} hover:scale-105`
                      : "border-transparent hover:border-[var(--border)]/50 hover:bg-[var(--card-bg)] hover:scale-105"
                    }`}
                >
                  <div
                    className={`${tier.color} ${isElite ? "tier-icon-glow" : ""} transition-transform duration-200 group-hover:scale-110`}
                    style={{ "--tier-glow": tier.hex } as React.CSSProperties}
                  >
                    <TierIcon tier={tier.name} size={isElite ? 36 : 28} />
                  </div>
                  <span className={`text-xs font-semibold ${tier.color} text-center leading-tight`}>
                    {tier.name}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    {tier.threshold}+
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-[var(--muted)] mt-6">
            Every problem updates your rating.
          </p>
        </div>
      </div>
    </main>
  );
}
