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
  const animClass = animate ? "tier-icon-spin" : "";
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
          {/* Simple tetrahedron: triangle with center lines */}
          <polygon points="16,4 4,28 28,28" />
          <line x1="16" y1="4" x2="16" y2="28" />
          <line x1="4" y1="28" x2="22" y2="16" />
          <line x1="28" y1="28" x2="10" y2="16" />
        </svg>
      );

    case "Square Pyramid":
      return (
        <svg {...props}>
          {/* Pyramid: square base + apex */}
          <polygon points="8,24 24,24 28,20 12,20" />
          <line x1="16" y1="5" x2="8" y2="24" />
          <line x1="16" y1="5" x2="24" y2="24" />
          <line x1="16" y1="5" x2="28" y2="20" />
          <line x1="16" y1="5" x2="12" y2="20" />
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
          {/* Pentagon front face + depth */}
          <polygon points="16,5 6,12 9,24 23,24 26,12" />
          <polygon points="20,3 10,10 13,22 27,22 30,10" strokeOpacity={0.4} />
          <line x1="16" y1="5" x2="20" y2="3" />
          <line x1="6" y1="12" x2="10" y2="10" />
          <line x1="9" y1="24" x2="13" y2="22" />
          <line x1="23" y1="24" x2="27" y2="22" />
          <line x1="26" y1="12" x2="30" y2="10" />
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
          {/* Simplified 7-sided prism front face + depth */}
          <polygon points="16,4 7,8 4,17 8,25 16,28 24,25 28,17 25,8" />
          <line x1="16" y1="4" x2="18" y2="2" strokeOpacity={0.5} />
          <line x1="25" y1="8" x2="27" y2="6" strokeOpacity={0.5} />
          <line x1="28" y1="17" x2="30" y2="15" strokeOpacity={0.5} />
          <line x1="24" y1="25" x2="26" y2="23" strokeOpacity={0.5} />
        </svg>
      );

    case "Square Antiprism":
      return (
        <svg {...props}>
          {/* Two rotated squares connected by triangular faces */}
          <rect x="9" y="6" width="14" height="0.1" transform="rotate(0, 16, 16)" />
          <polygon points="9,8 23,8 23,8 9,8" />
          <polygon points="16,6 6,10 6,22 16,26 26,22 26,10" />
          <line x1="6" y1="10" x2="26" y2="10" />
          <line x1="6" y1="22" x2="26" y2="22" />
          <line x1="6" y1="10" x2="16" y2="6" />
          <line x1="26" y1="10" x2="16" y2="6" />
          <line x1="6" y1="22" x2="16" y2="26" />
          <line x1="26" y1="22" x2="16" y2="26" />
          <line x1="6" y1="10" x2="16" y2="14" strokeOpacity={0.3} />
          <line x1="26" y1="10" x2="16" y2="14" strokeOpacity={0.3} />
          <line x1="6" y1="22" x2="16" y2="18" strokeOpacity={0.3} />
          <line x1="26" y1="22" x2="16" y2="18" strokeOpacity={0.3} />
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
          {/* Two rotated hexagons connected */}
          <polygon points="16,3 7,7 4,16 7,25 16,29 25,25 28,16 25,7" />
          <line x1="4" y1="16" x2="28" y2="16" strokeOpacity={0.3} />
          <line x1="7" y1="7" x2="25" y2="25" strokeOpacity={0.3} />
          <line x1="25" y1="7" x2="7" y2="25" strokeOpacity={0.3} />
          <circle cx="16" cy="16" r="7" strokeOpacity={0.2} />
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
