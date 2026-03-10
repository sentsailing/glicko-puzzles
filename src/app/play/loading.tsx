export default function PlayLoading() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-[var(--muted)]">Loading problem...</div>
          <p className="text-xs text-[var(--muted)]/60">
            Adaptive math practice — AMC 8, AMC 10, AMC 12, and AIME problems matched to your skill level.
          </p>
        </div>
      </div>
    </main>
  );
}
