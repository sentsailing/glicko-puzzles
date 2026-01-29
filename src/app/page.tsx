import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <span className="text-xl font-bold">Math ELO</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">Math ELO</h1>
          <p className="text-[var(--muted)] mb-8">
            Solve math problems matched to your skill level. Your rating updates
            after each attempt using the ELO system.
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
              <div className="text-2xl font-bold">ELO</div>
              <div className="text-sm text-[var(--muted)]">Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-[var(--muted)]">Difficulties</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
