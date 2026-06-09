/**
 * LivingCircle — the ArbiCycle signature visual.
 *
 * Members sit around a circle.  Contributions flow inward.
 * Payouts flow to the recipient.  The Guardian ring orbits outside.
 *
 * Can be used with real on-chain members or a static demo array.
 */

export interface CircleMember {
  addr:        string;
  label:       string;   // short display name or initials
  contributed: boolean;
  received:    boolean;
  isRecipient: boolean;
}

export interface LivingCircleProps {
  members:        CircleMember[];
  potValue?:      string;   // e.g. "$1,200"
  size?:          number;   // SVG dimensions (square), default 400
  showGuardian?:  boolean;
  animate?:       boolean;
  round?:         number;
}

/* ─── colour constants ─────────────────────────────────── */
const C = {
  obsidian:  "#111111",
  ivory:     "#F5F2EA",
  ivoryDim:  "#A8A49C",
  ivoryGhost:"#3A3733",
  emerald:   "#0F6B50",
  emeraldBright: "#17A77A",
  gold:      "#C88B3A",
  goldBright:"#E8A84A",
  slate:     "#46505A",
  surface1:  "#181818",
  surface2:  "#202020",
} as const;

/* ─── default demo members ────────────────────────────── */
export const DEMO_MEMBERS: CircleMember[] = [
  { addr:"0x001", label:"Amara",   contributed:true,  received:true,  isRecipient:false },
  { addr:"0x002", label:"James",   contributed:true,  received:true,  isRecipient:false },
  { addr:"0x003", label:"Kofi",    contributed:true,  received:false, isRecipient:true  },
  { addr:"0x004", label:"Sarah",   contributed:true,  received:false, isRecipient:false },
  { addr:"0x005", label:"Zuri",    contributed:false, received:false, isRecipient:false },
  { addr:"0x006", label:"Michael", contributed:false, received:false, isRecipient:false },
];

/* ─── helpers ─────────────────────────────────────────── */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function memberColor(m: CircleMember) {
  if (m.isRecipient)           return C.gold;
  if (m.received)              return C.emeraldBright;
  if (m.contributed)           return C.emerald;
  return C.slate;
}

function memberStroke(m: CircleMember) {
  if (m.isRecipient) return C.goldBright;
  if (m.received)    return C.emeraldBright;
  if (m.contributed) return C.emeraldBright;
  return "#3A3733";
}

function memberLabel(m: CircleMember) {
  if (m.isRecipient) return "●";   // crown‑like dot
  if (m.received)    return "✓";
  return m.label.slice(0, 2).toUpperCase();
}

/* ─── component ───────────────────────────────────────── */
export default function LivingCircle({
  members       = DEMO_MEMBERS,
  potValue      = "$0",
  size          = 400,
  showGuardian  = true,
  animate       = true,
  round         = 1,
}: LivingCircleProps) {
  const cx = size / 2;
  const cy = size / 2;

  // Radii
  const memberR   = size * 0.385;  // members sit at this distance from center
  const nodeR     = size * 0.058;  // member circle node radius
  const innerR    = size * 0.175;  // inner decorative ring
  const centerR   = size * 0.13;   // center circle
  const guardianR = size * 0.465;  // guardian orbital ring

  const n = members.length;
  if (n === 0) return null;

  const recipient = members.find(m => m.isRecipient);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      style={{ maxWidth: size, display: "block" }}
      aria-label="Living Wealth Circle"
      role="img"
    >
      <defs>
        {/* Gold glow filter */}
        <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Emerald glow */}
        <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Radial gradient for center */}
        <radialGradient id="center-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={C.surface2} />
          <stop offset="100%" stopColor={C.obsidian} />
        </radialGradient>
        {/* Gold radial for recipient glow */}
        <radialGradient id="gold-glow-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={C.gold} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
        </radialGradient>
        {/* Emerald radial for general glow */}
        <radialGradient id="emerald-glow-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={C.emerald} stopOpacity="0.10" />
          <stop offset="100%" stopColor={C.emerald} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Background ambient ─────────────────────────── */}
      {recipient && (
        <circle
          cx={cx} cy={cy} r={guardianR * 0.9}
          fill="url(#gold-glow-bg)"
          style={animate ? { animation: "center-breathe 4s ease-in-out infinite" } : {}}
        />
      )}
      {!recipient && (
        <circle cx={cx} cy={cy} r={guardianR * 0.9} fill="url(#emerald-glow-bg)" />
      )}

      {/* ── Guardian orbital ring (outermost) ─────────── */}
      {showGuardian && (
        <>
          {/* Slow outer ring */}
          <g style={animate ? {
            transformOrigin: `${cx}px ${cy}px`,
            animation: "guardian-orbit 32s linear infinite reverse",
          } : {}}>
            <circle
              cx={cx} cy={cy} r={guardianR}
              fill="none"
              stroke="rgba(200,139,58,0.12)"
              strokeWidth="1"
              strokeDasharray="2 14"
            />
          </g>
          {/* Fast inner guardian ring */}
          <g style={animate ? {
            transformOrigin: `${cx}px ${cy}px`,
            animation: "guardian-orbit 18s linear infinite",
          } : {}}>
            <circle
              cx={cx} cy={cy} r={guardianR - size * 0.025}
              fill="none"
              stroke="rgba(200,139,58,0.22)"
              strokeWidth="1.5"
              strokeDasharray="5 9"
            />
          </g>
          {/* Guardian label at top */}
          <text
            x={cx}
            y={cy - guardianR - size * 0.04}
            textAnchor="middle"
            fill="rgba(200,139,58,0.45)"
            fontSize={size * 0.025}
            fontFamily="Space Grotesk, Inter, sans-serif"
            fontWeight="600"
            letterSpacing="0.12em"
          >
            CIRCLE GUARDIAN
          </text>
        </>
      )}

      {/* ── Member track ring ────────────────────────── */}
      <circle
        cx={cx} cy={cy} r={memberR}
        fill="none"
        stroke="rgba(245,242,234,0.06)"
        strokeWidth="1"
        strokeDasharray="1 6"
      />

      {/* ── Inner decorative ring ────────────────────── */}
      <circle
        cx={cx} cy={cy} r={innerR}
        fill="none"
        stroke="rgba(245,242,234,0.05)"
        strokeWidth="1"
      />

      {/* ── Connection lines (member → center) ───────── */}
      {members.map((m, i) => {
        const angle = (i / n) * 360;
        const pos   = polarToCartesian(cx, cy, memberR, angle);
        const isActive = m.contributed || m.received || m.isRecipient;
        const col = m.isRecipient ? `rgba(200,139,58,0.35)`
                  : m.received    ? `rgba(23,167,122,0.30)`
                  : m.contributed ? `rgba(15,107,80,0.25)`
                  :                 `rgba(70,80,90,0.12)`;
        return (
          <line
            key={`line-${m.addr}`}
            x1={pos.x} y1={pos.y}
            x2={cx}    y2={cy}
            stroke={col}
            strokeWidth={isActive ? 1.5 : 0.8}
            strokeDasharray={m.isRecipient ? "none" : "3 4"}
          />
        );
      })}

      {/* ── Center circle ────────────────────────────── */}
      <circle
        cx={cx} cy={cy} r={centerR * 1.4}
        fill="url(#center-bg)"
        stroke={recipient ? `rgba(200,139,58,0.30)` : `rgba(15,107,80,0.22)`}
        strokeWidth="1.5"
      />

      {/* Center: pot value */}
      <text
        x={cx}
        y={cy - size * 0.015}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={recipient ? C.goldBright : C.ivory}
        fontSize={size * 0.065}
        fontFamily="Space Grotesk, Inter, sans-serif"
        fontWeight="700"
        letterSpacing="-0.03em"
        style={animate && recipient ? { animation: "center-breathe 4s ease-in-out infinite" } : {}}
      >
        {potValue}
      </text>
      <text
        x={cx}
        y={cy + size * 0.06}
        textAnchor="middle"
        fill="rgba(168,164,156,0.70)"
        fontSize={size * 0.028}
        fontFamily="Inter, sans-serif"
        letterSpacing="0.06em"
        fontWeight="500"
      >
        ROUND {round}
      </text>

      {/* ── Member nodes ─────────────────────────────── */}
      {members.map((m, i) => {
        const angle = (i / n) * 360;
        const pos   = polarToCartesian(cx, cy, memberR, angle);
        const color = memberColor(m);
        const stroke = memberStroke(m);
        const label = memberLabel(m);
        const isRecipient = m.isRecipient;

        // Label position: push it outward from center
        const labelOffset = nodeR * 2.2;
        const labelPos = polarToCartesian(cx, cy, memberR + labelOffset, angle);

        return (
          <g key={`node-${m.addr}`}>
            {/* Glow halo for recipient */}
            {isRecipient && (
              <circle
                cx={pos.x} cy={pos.y} r={nodeR * 1.9}
                fill="rgba(200,139,58,0.10)"
                style={animate ? { animation: "recipient-pulse 2.5s ease-in-out infinite" } : {}}
              />
            )}
            {/* Outer ring */}
            <circle
              cx={pos.x} cy={pos.y} r={nodeR + 3}
              fill="none"
              stroke={stroke}
              strokeWidth={isRecipient ? 2 : 1}
              opacity={isRecipient ? 0.8 : 0.4}
              style={animate && isRecipient ? { animation: "recipient-pulse 2.5s ease-in-out infinite" } : {}}
            />
            {/* Node fill */}
            <circle
              cx={pos.x} cy={pos.y} r={nodeR}
              fill={color}
              opacity={0.9}
            />
            {/* Node label */}
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isRecipient ? C.obsidian : "#F5F2EA"}
              fontSize={isRecipient ? size * 0.035 : size * 0.030}
              fontFamily={isRecipient ? "Space Grotesk, sans-serif" : "Inter, sans-serif"}
              fontWeight={isRecipient ? "700" : "600"}
            >
              {label}
            </text>
            {/* Name label outside ring */}
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isRecipient ? C.goldBright : m.received ? C.emeraldBright : "rgba(168,164,156,0.70)"}
              fontSize={size * 0.028}
              fontFamily="Inter, sans-serif"
              fontWeight={isRecipient ? "700" : "500"}
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* ── Recipient arc highlight ───────────────────── */}
      {recipient && (() => {
        const i = members.findIndex(m => m.isRecipient);
        const angle = (i / n) * 360;
        const start = polarToCartesian(cx, cy, memberR, angle - 25);
        const end   = polarToCartesian(cx, cy, memberR, angle + 25);
        const d = `M ${start.x} ${start.y} A ${memberR} ${memberR} 0 0 1 ${end.x} ${end.y}`;
        return (
          <path
            d={d}
            fill="none"
            stroke={C.gold}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
            style={animate ? { animation: "recipient-pulse 2.5s ease-in-out infinite" } : {}}
          />
        );
      })()}

      {/* ── Rotation order indicator ──────────────────── */}
      <text
        x={cx}
        y={size - size * 0.04}
        textAnchor="middle"
        fill="rgba(168,164,156,0.35)"
        fontSize={size * 0.022}
        fontFamily="Inter, sans-serif"
        letterSpacing="0.04em"
      >
        VRF VERIFIED ORDER
      </text>
    </svg>
  );
}
