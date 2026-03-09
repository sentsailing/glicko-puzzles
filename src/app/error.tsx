"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl mb-2">⚠️</div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-[var(--muted)]">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--muted)] font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[var(--accent)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 border border-[var(--border)] rounded-lg font-medium hover:bg-[var(--border)]/30 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </main>
  );
}
