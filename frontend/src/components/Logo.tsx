/**
 * ArbiCycle Logo components — pure SVG, no image files needed.
 *
 * EmblemIcon  — the circular-arrows + A mark
 * WordmarkSVG — "ArbiCycle" with gradient fill
 * Logo        — emblem + wordmark side-by-side (default export)
 */

/* ─── Emblem ─────────────────────────────────────────────────── */
export function EmblemIcon({
  size = 32,
  color = "#17A77A",
}: {
  size?: number;
  color?: string;
}) {
  // Two arcs that together form a full circle, each with an arrowhead.
  // ViewBox 0 0 100 100, centre (50,50), arc radius 36.
  // Split points at angle 210° (upper-left) and 30° (lower-right).
  const r = 36;
  const cx = 50, cy = 50;

  // polar → cartesian helper (SVG angle: 0° = right, CW)
  const pt = (deg: number) => ({
    x: cx + r * Math.cos((deg * Math.PI) / 180),
    y: cy + r * Math.sin((deg * Math.PI) / 180),
  });

  const p210 = pt(210); // ≈ (18.8, 32)
  const p30  = pt(30);  // ≈ (81.2, 68)

  // Arc 1: from p210 to just before p30 (CW, large arc)
  const a1end = pt(25); // slightly before p30 so arrowhead fits
  // Arc 2: from p30 to just before p210 (CW, large arc)
  const a2end = pt(205);

  const sw = 9; // stroke width

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Arc 1: top-left → bottom-right (CW, large arc = 1) */}
      <path
        d={`M ${p210.x.toFixed(1)},${p210.y.toFixed(1)}
            A ${r},${r} 0 1 1 ${a1end.x.toFixed(1)},${a1end.y.toFixed(1)}`}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead 1 at p30 (pointing clockwise / downward-right) */}
      <polygon
        points={`${p30.x.toFixed(1)},${p30.y.toFixed(1)} ${(p30.x - 9).toFixed(1)},${(p30.y - 4).toFixed(1)} ${(p30.x - 3).toFixed(1)},${(p30.y + 8).toFixed(1)}`}
        fill={color}
      />

      {/* Arc 2: bottom-right → top-left (CW, large arc = 1) */}
      <path
        d={`M ${p30.x.toFixed(1)},${p30.y.toFixed(1)}
            A ${r},${r} 0 1 1 ${a2end.x.toFixed(1)},${a2end.y.toFixed(1)}`}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrowhead 2 at p210 (pointing clockwise / upward-left) */}
      <polygon
        points={`${p210.x.toFixed(1)},${p210.y.toFixed(1)} ${(p210.x + 9).toFixed(1)},${(p210.y + 4).toFixed(1)} ${(p210.x + 3).toFixed(1)},${(p210.y - 8).toFixed(1)}`}
        fill={color}
      />

      {/* Bold "A" centred */}
      <path
        d="M 50,20 L 31,74 L 39,74 L 44,56 L 56,56 L 61,74 L 69,74 L 50,20 Z"
        fill={color}
      />
      {/* crossbar of A */}
      <rect x="43" y="49" width="14" height="5" fill={color} />
    </svg>
  );
}

/* ─── Wordmark ───────────────────────────────────────────────── */
export function WordmarkSVG({
  height = 22,
  lightMode = false,
}: {
  height?: number;
  lightMode?: boolean;
}) {
  const gradId = "wm-grad";
  // Approximate aspect ratio of "ArbiCycle" in Space Grotesk Bold
  const width = height * 5.2;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1EC8A0" />
          <stop offset="100%" stopColor="#0F8060" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y={height * 0.82}
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize={height}
        letterSpacing="-0.03em"
        fill={lightMode ? "#111111" : `url(#${gradId})`}
      >
        ArbiCycle
      </text>
    </svg>
  );
}

/* ─── Combined Logo ──────────────────────────────────────────── */
export function Logo({
  iconSize = 28,
  textHeight = 20,
  gap = 8,
  iconColor = "#17A77A",
}: {
  iconSize?: number;
  textHeight?: number;
  gap?: number;
  iconColor?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap }}>
      <EmblemIcon size={iconSize} color={iconColor} />
      <WordmarkSVG height={textHeight} />
    </span>
  );
}

export default Logo;
