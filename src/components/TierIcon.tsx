/**
 * SVG wireframe icons for each geometric-solid tier.
 * All icons use currentColor for stroke so the parent's text color applies.
 */

interface TierIconProps {
  /** Tier name — must match one of the TIERS entries. */
  tier: string;
  /** Icon size in pixels (width & height). Default 24. */
  size?: number;
  className?: string;
  /** Add slow 3D spin animation. */
  animate?: boolean;
}

export function TierIcon({ tier, size = 24, className = "", animate = false }: TierIconProps) {
  const animClass = animate
    ? tier === "Icosahedron" ? "tier-icon-icosa" : "tier-icon-spin"
    : "";
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    className: `${animClass} ${className}`.trim(),
  };

  switch (tier) {
    case "Tetrahedron":
      return (
        <svg {...props}>
          {/* 3D tetrahedron — side view, two visible faces */}
          <line x1="16" y1="2" x2="3" y2="27" />
          <line x1="16" y1="2" x2="29" y2="27" />
          <line x1="3" y1="27" x2="29" y2="27" />
          <line x1="16" y1="2" x2="16" y2="27" />
          <line x1="3" y1="27" x2="16" y2="16" />
          <line x1="29" y1="27" x2="16" y2="16" />
          {/* Hidden back edge */}
          <line x1="3" y1="27" x2="29" y2="16" strokeOpacity={0.25} strokeDasharray="2,2" />
        </svg>
      );

    case "Square Pyramid":
      return (
        <svg {...props}>
          {/* 3D pyramid — centered, looking from front-above */}
          {/* Base square in perspective */}
          <line x1="6" y1="25" x2="26" y2="25" />
          <line x1="26" y1="25" x2="24" y2="17" />
          <line x1="6" y1="25" x2="8" y2="17" />
          <line x1="8" y1="17" x2="24" y2="17" strokeOpacity={0.3} strokeDasharray="2,2" />
          {/* Apex edges */}
          <line x1="16" y1="4" x2="6" y2="25" />
          <line x1="16" y1="4" x2="26" y2="25" />
          <line x1="16" y1="4" x2="24" y2="17" />
          <line x1="16" y1="4" x2="8" y2="17" strokeOpacity={0.5} />
        </svg>
      );

    case "Cube":
      return (
        <svg {...props}>
          {/* Classic 3D cube wireframe */}
          <rect x="6" y="10" width="14" height="14" />
          <rect x="12" y="6" width="14" height="14" />
          <line x1="6" y1="10" x2="12" y2="6" />
          <line x1="20" y1="10" x2="26" y2="6" />
          <line x1="20" y1="24" x2="26" y2="20" />
          <line x1="6" y1="24" x2="12" y2="20" />
        </svg>
      );

    case "Pentagonal Prism":
      return (
        <svg {...props}>
          {/* Front pentagon face */}
          <polygon points="13,6 23,12 20,25 6,25 3,12" />
          {/* Back pentagon face */}
          <polygon points="18,4 28,10 25,23 11,23 8,10" strokeOpacity={0.3} />
          {/* Visible connecting depth edges (top/right) */}
          <line x1="13" y1="6" x2="18" y2="4" />
          <line x1="23" y1="12" x2="28" y2="10" />
          <line x1="20" y1="25" x2="25" y2="23" />
          {/* Hidden connecting edges (left/bottom) */}
          <line x1="6" y1="25" x2="11" y2="23" strokeOpacity={0.3} />
          <line x1="3" y1="12" x2="8" y2="10" strokeOpacity={0.3} />
        </svg>
      );

    case "Octahedron":
      return (
        <svg {...props}>
          {/* Diamond shape: two pyramids joined at equator */}
          <polygon points="16,3 4,16 16,29 28,16" />
          <line x1="4" y1="16" x2="28" y2="16" />
          <line x1="16" y1="3" x2="16" y2="29" strokeOpacity={0.3} />
          <line x1="10" y1="9" x2="22" y2="23" strokeOpacity={0.3} />
          <line x1="22" y1="9" x2="10" y2="23" strokeOpacity={0.3} />
        </svg>
      );

    case "Heptagonal Prism":
      return (
        <svg {...props}>
          {/* Front heptagonal face */}
          <polygon points="11,5 20,7 24,15 21,24 11,27 4,21 3,12" />
          {/* Back heptagonal face */}
          <polygon points="16,3 25,5 29,13 26,22 16,25 9,19 8,10" strokeOpacity={0.3} />
          {/* Visible connecting edges (top/right) */}
          <line x1="11" y1="5" x2="16" y2="3" />
          <line x1="20" y1="7" x2="25" y2="5" />
          <line x1="24" y1="15" x2="29" y2="13" />
          <line x1="21" y1="24" x2="26" y2="22" />
          {/* Hidden connecting edges (left/bottom) */}
          <line x1="11" y1="27" x2="16" y2="25" strokeOpacity={0.3} />
          <line x1="4" y1="21" x2="9" y2="19" strokeOpacity={0.3} />
          <line x1="3" y1="12" x2="8" y2="10" strokeOpacity={0.3} />
        </svg>
      );

    case "Square Antiprism":
      return (
        <svg {...props}>
          {/* Top square face in perspective */}
          <polygon points="9,6 23,6 24,12 8,12" />
          {/* Bottom square face rotated 45° */}
          <polygon points="16,19 28,23 16,27 4,23" />
          {/* Front connecting zigzag edges */}
          <line x1="23" y1="6" x2="28" y2="23" />
          <line x1="24" y1="12" x2="28" y2="23" />
          <line x1="24" y1="12" x2="16" y2="27" />
          <line x1="8" y1="12" x2="16" y2="27" />
          <line x1="8" y1="12" x2="4" y2="23" />
          <line x1="9" y1="6" x2="4" y2="23" />
          {/* Back connecting edges (hidden) */}
          <line x1="9" y1="6" x2="16" y2="19" strokeOpacity={0.25} />
          <line x1="23" y1="6" x2="16" y2="19" strokeOpacity={0.25} />
        </svg>
      );

    case "Dodecahedron":
      return (
        <svg {...props}>
          {/* Dodecahedron: outer pentagon + inner pentagon + connecting edges */}
          <polygon points="16,2 3,11 8,27 24,27 29,11" />
          <polygon points="16,9 8,15 11,24 21,24 24,15" />
          <line x1="16" y1="2" x2="16" y2="9" />
          <line x1="3" y1="11" x2="8" y2="15" />
          <line x1="8" y1="27" x2="11" y2="24" />
          <line x1="24" y1="27" x2="21" y2="24" />
          <line x1="29" y1="11" x2="24" y2="15" />
        </svg>
      );

    case "Hexagonal Antiprism":
      return (
        <svg {...props}>
          {/* Top hexagonal face in perspective */}
          <polygon points="16,4 25,7 26,13 16,16 6,13 7,7" />
          {/* Bottom hexagonal face rotated 30° */}
          <polygon points="21,19 28,23 22,28 10,28 4,23 11,19" />
          {/* Front connecting zigzag edges */}
          <line x1="25" y1="7" x2="21" y2="19" />
          <line x1="26" y1="13" x2="28" y2="23" />
          <line x1="26" y1="13" x2="21" y2="19" />
          <line x1="16" y1="16" x2="22" y2="28" />
          <line x1="16" y1="16" x2="10" y2="28" />
          <line x1="6" y1="13" x2="4" y2="23" />
          <line x1="6" y1="13" x2="11" y2="19" />
          <line x1="7" y1="7" x2="4" y2="23" />
          {/* Back connecting edges (hidden) */}
          <line x1="16" y1="4" x2="21" y2="19" strokeOpacity={0.25} />
          <line x1="16" y1="4" x2="11" y2="19" strokeOpacity={0.25} />
          <line x1="25" y1="7" x2="28" y2="23" strokeOpacity={0.25} />
          <line x1="7" y1="7" x2="11" y2="19" strokeOpacity={0.25} />
        </svg>
      );

    case "Icosahedron":
      return (
        <svg {...props}>
          {/* Simplified icosahedron: outer pentagon + inner star pattern */}
          <polygon points="16,2 3,12 8,28 24,28 29,12" />
          <polygon points="16,8 6,18 10,28 22,28 26,18" strokeOpacity={0.5} />
          <line x1="16" y1="2" x2="6" y2="18" strokeOpacity={0.4} />
          <line x1="16" y1="2" x2="26" y2="18" strokeOpacity={0.4} />
          <line x1="3" y1="12" x2="22" y2="28" strokeOpacity={0.4} />
          <line x1="29" y1="12" x2="10" y2="28" strokeOpacity={0.4} />
          <line x1="8" y1="28" x2="24" y2="28" />
        </svg>
      );

    default:
      // Fallback: simple diamond
      return (
        <svg {...props}>
          <polygon points="16,4 4,16 16,28 28,16" />
        </svg>
      );
  }
}
