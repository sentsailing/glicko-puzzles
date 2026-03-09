import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-7xl font-bold text-[var(--muted)]">404</div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-[var(--muted)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-[var(--accent)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
