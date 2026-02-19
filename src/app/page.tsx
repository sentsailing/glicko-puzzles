import Link from "next/link";
import { Header } from "@/components/Header";
import { TierIcon } from "@/components/TierIcon";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <TierIcon tier="Icosahedron" size={64} className="text-[var(--accent)] tier-icon-spin" />
          </div>
          <h1 className="text-4xl font-bold mb-4">MathELO</h1>
          <p className="text-[var(--muted)] mb-8">
            Solve math problems matched to your skill level. Your rating updates
            after each attempt using the Glicko-2 system.
          </p>

          <div className="space-y-4">
            <Link
              href="/play"
              className="block w-full py-3 px-6 bg-[var(--accent)] text-white font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
            >
              Start Playing
            </Link>

            <div className="text-sm text-[var(--muted)]">
              No account needed. Play anonymously.
            </div>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">30+</div>
              <div className="text-sm text-[var(--muted)]">Problems</div>
            </div>
            <div>
              <div className="text-2xl font-bold">10</div>
              <div className="text-sm text-[var(--muted)]">Tiers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">ELO</div>
              <div className="text-sm text-[var(--muted)]">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
