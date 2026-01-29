import type { Metadata } from "next";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math ELO",
  description: "Competitive math practice matched to your skill level",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--background)] antialiased">
        <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
      </body>
    </html>
  );
}
