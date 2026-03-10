import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GLICKGLICK — Math Practice",
    short_name: "GLICKGLICK",
    description:
      "Free adaptive math practice for students. AMC, AIME, and competition math problems with Glicko-2 rating.",
    start_url: "/play",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#2563eb",
    categories: ["education", "games"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  };
}
