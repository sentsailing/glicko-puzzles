import type { Metadata } from "next";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { UsernameGate } from "@/components/UsernameGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolyPuzzle",
  description: "Competitive math practice matched to your skill level",
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
        <ThemeProvider>
          <FirebaseAuthProvider>
            <SessionProvider>
              <UsernameGate>{children}</UsernameGate>
            </SessionProvider>
          </FirebaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
