import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { UsernameGate } from "@/components/UsernameGate";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GLICKGLICK — Rating-Based Math Practice",
    template: "%s | GLICKGLICK",
  },
  description: "Solve math problems matched to your skill level. Compete on leaderboards with a Glicko-2 rating system. AMC, AIME, and more.",
  openGraph: {
    title: "GLICKGLICK — Rating-Based Math Practice",
    description: "Solve math problems matched to your skill level. Compete on leaderboards with a Glicko-2 rating system.",
    type: "website",
    siteName: "GLICKGLICK",
  },
  twitter: {
    card: "summary",
    title: "GLICKGLICK — Rating-Based Math Practice",
    description: "Solve math problems matched to your skill level. Compete on leaderboards with a Glicko-2 rating system.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Inline script to apply dark class before first paint (prevents flash)
const themeScript = `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-[var(--background)] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--accent)] focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <FirebaseAuthProvider>
            <SessionProvider>
              <UsernameGate>
                {children}
                <footer className="py-6 text-center text-xs text-[var(--muted)]">
                  <a href="/privacy" className="hover:text-[var(--foreground)] transition-colors">
                    Privacy Policy
                  </a>
                </footer>
              </UsernameGate>
            </SessionProvider>
          </FirebaseAuthProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
