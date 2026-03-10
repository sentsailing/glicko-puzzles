import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { UsernameGate } from "@/components/UsernameGate";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://glickglick.com"),
  title: {
    default: "GLICKGLICK — Rating-Based Math Practice for Students",
    template: "%s | GLICKGLICK",
  },
  description:
    "Free educational math practice platform for students. Adaptive difficulty using Glicko-2 ratings across AMC, AIME, and competition math topics. Used for classroom practice, homework, and math competition preparation.",
  keywords: [
    "math practice",
    "educational",
    "math competition",
    "AMC",
    "AIME",
    "student learning",
    "adaptive learning",
    "classroom",
    "homework",
    "K-12 education",
    "math education",
    "STEM",
    "Glicko rating",
    "math puzzles",
  ],
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "GLICKGLICK — Educational Math Practice for Students",
    description:
      "Free adaptive math practice platform for students. Competition-level problems with skill-based rating. Ideal for classroom use and math competition prep.",
    type: "website",
    siteName: "GLICKGLICK",
    url: "https://glickglick.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "GLICKGLICK — Educational Math Practice for Students",
    description:
      "Free adaptive math practice platform for students. Competition-level problems with skill-based rating.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "classification": "Education",
    "rating": "General",
    "audience": "Students, Teachers, Educators",
    "topic": "Mathematics Education",
    "subject": "Mathematics",
    "coverage": "Worldwide",
  },
};

// Inline script to apply dark class before first paint (prevents flash)
const themeScript = `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GLICKGLICK",
  url: "https://glickglick.com",
  description:
    "Free educational math practice platform with adaptive difficulty for students. Covers AMC, AIME, and competition math topics using a Glicko-2 rating system.",
  applicationCategory: "EducationalApplication",
  educationalUse: ["Practice", "Self Assessment", "Homework", "Competition Preparation"],
  audience: {
    "@type": "EducationalAudience",
    educationalRole: "student",
    audienceType: "Students, Teachers, Parents",
  },
  isAccessibleForFree: true,
  inLanguage: "en",
  about: {
    "@type": "Thing",
    name: "Mathematics Education",
  },
  teaches: ["Mathematics", "Problem Solving", "Competition Mathematics", "AMC", "AIME"],
  typicalAgeRange: "10-18",
  learningResourceType: "Practice",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
