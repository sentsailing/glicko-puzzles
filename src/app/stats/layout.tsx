import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Stats",
  description:
    "Track your math rating, accuracy, streaks, and progress across AMC and AIME competition problems on GLICKGLICK.",
  alternates: {
    canonical: "/stats",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://glickglick.com" },
    { "@type": "ListItem", position: 2, name: "Stats", item: "https://glickglick.com/stats" },
  ],
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
