export default function LeaderboardLoading() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-[var(--muted)]">Loading leaderboard...</div>
          <p className="text-xs text-[var(--muted)]/60">
            Top-ranked students solving AMC and AIME competition math problems.
          </p>
        </div>
      </div>
    </main>
  );
}
