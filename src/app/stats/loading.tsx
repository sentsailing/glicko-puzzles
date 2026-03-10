export default function StatsLoading() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-[var(--muted)]">Loading stats...</div>
          <p className="text-xs text-[var(--muted)]/60">
            Your math rating, accuracy, and progress across competition problems.
          </p>
        </div>
      </div>
    </main>
  );
}
