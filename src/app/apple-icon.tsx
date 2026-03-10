import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 32 32"
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          strokeLinejoin="round"
        >
          <polygon points="16,3 4,16 16,29 28,16" />
          <line x1="4" y1="16" x2="28" y2="16" />
          <line x1="16" y1="3" x2="16" y2="29" strokeOpacity="0.3" />
          <line x1="10" y1="9" x2="22" y2="23" strokeOpacity="0.3" />
          <line x1="22" y1="9" x2="10" y2="23" strokeOpacity="0.3" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
