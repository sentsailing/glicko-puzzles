import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          Last updated: March 9, 2026
        </p>

        <div className="space-y-8 text-[var(--foreground)]/90 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-3">What We Collect</h2>
            <p>
              When you use GLICKGLICK without signing in, we store a session
              token in your browser to track your rating and progress. No
              personal information is collected for anonymous sessions.
            </p>
            <p className="mt-2">
              When you sign in with Google, we receive your name, email address,
              and profile picture from Google. We use this to link your account
              and display your name on the leaderboard (if you choose a
              username).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintain your rating and attempt history</li>
              <li>Display your rank on the leaderboard</li>
              <li>Match problems to your skill level</li>
              <li>Improve the platform through aggregated, anonymous analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Authentication</h2>
            <p>
              Sign-in is handled by Firebase Authentication (Google). We do not
              store your Google password. Authentication tokens are managed by
              Firebase and stored securely in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Analytics</h2>
            <p>
              We use Vercel Analytics to collect anonymous usage data such as
              page views and performance metrics. This data does not include
              personally identifiable information and is not shared with third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Cookies &amp; Local Storage</h2>
            <p>
              We use browser local storage to save your session token, theme
              preference, and rating data. Firebase may set cookies for
              authentication purposes. We do not use tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
            <p>
              Your game data (ratings, attempts) is retained as long as your
              account exists. Anonymous session data may be periodically cleaned
              up. You can request deletion of your data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Firebase Authentication</strong> — for Google sign-in (
                <a
                  href="https://firebase.google.com/support/privacy"
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase Privacy Policy
                </a>
                )
              </li>
              <li>
                <strong>Vercel</strong> — for hosting and analytics (
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel Privacy Policy
                </a>
                )
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your
              personal data at any time. To make a request, open an issue on our{" "}
              <a
                href="https://github.com/sentsailing/glicko-puzzles"
                className="text-[var(--accent)] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub repository
              </a>{" "}
              or contact us via the repository.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Changes</h2>
            <p>
              We may update this policy from time to time. Changes will be
              posted on this page with an updated date.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
