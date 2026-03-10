import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top-ranked math students on GLICKGLICK. Compete with other students solving AMC and AIME competition math problems.",
  keywords: [
    "math leaderboard",
    "AMC rankings",
    "math competition rankings",
    "student math ratings",
  ],
  alternates: {
    canonical: "/leaderboard",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://glickglick.com" },
    { "@type": "ListItem", position: 2, name: "Leaderboard", item: "https://glickglick.com/leaderboard" },
  ],
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
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
