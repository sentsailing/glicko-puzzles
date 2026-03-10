import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { HeroCTA } from "@/components/HeroCTA";
import { TierShowcase } from "@/components/TierShowcase";

export const metadata: Metadata = {
  title: "GLICKGLICK — Free Adaptive Math Practice for Students",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 gap-8">
        <div className="text-center animate-fade-in-up">
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight mb-3">
            GLICKGLICK.COM
          </h1>
          <p className="text-xl text-[var(--muted)]">
            Math puzzles that fight back.
          </p>
        </div>

        <div className="animate-fade-in-up stagger-2">
          <TierShowcase />
        </div>

        <div className="animate-fade-in-up stagger-3">
          <HeroCTA />
        </div>
      </div>
    </main>
  );
}
