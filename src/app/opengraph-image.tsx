import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GLICKGLICK — Free Adaptive Math Practice for Students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative geometric shapes */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            width: 120,
            height: 120,
            border: "2px solid rgba(99, 102, 241, 0.3)",
            transform: "rotate(45deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 100,
            width: 90,
            height: 90,
            border: "2px solid rgba(59, 130, 246, 0.3)",
            transform: "rotate(30deg)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 120,
            right: 200,
            width: 60,
            height: 60,
            border: "2px solid rgba(168, 85, 247, 0.2)",
            transform: "rotate(15deg)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "white",
              display: "flex",
            }}
          >
            GLICKGLICK
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.5)",
              display: "flex",
            }}
          >
            Math puzzles that fight back.
          </div>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "rgba(255, 255, 255, 0.4)",
              display: "flex",
            }}
          >
            Free adaptive math practice — AMC, AIME, and more
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
