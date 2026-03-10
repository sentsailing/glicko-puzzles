import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Practice Math Problems",
  description:
    "Solve adaptive math problems matched to your skill level. Covers AMC 8, AMC 10, AMC 12, and AIME competition problems with instant feedback and Glicko-2 rating.",
  keywords: [
    "AMC practice problems",
    "AIME practice",
    "math competition practice",
    "adaptive math problems",
    "AMC 8 practice",
    "AMC 10 practice",
    "AMC 12 practice",
    "free math problems",
  ],
  alternates: {
    canonical: "/play",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Quiz",
  name: "GLICKGLICK Math Practice",
  description:
    "Adaptive math competition practice problems covering AMC 8, AMC 10, AMC 12, and AIME.",
  educationalLevel: ["Middle School", "High School"],
  about: { "@type": "Thing", name: "Mathematics" },
  isAccessibleForFree: true,
  provider: {
    "@type": "Organization",
    name: "GLICKGLICK",
    url: "https://glickglick.com",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://glickglick.com" },
      { "@type": "ListItem", position: 2, name: "Practice", item: "https://glickglick.com/play" },
    ],
  },
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
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
