import { useNavigate } from "react-router-dom";
import { useReadContracts } from "wagmi";
import { CIRCLE_ABI } from "../config/abis";
import { formatUnits } from "viem";
import { Users, Clock, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ─── tokens ─────────────────────────────────────────────── */
const T = {
  surface1:    "#181818",
  surface2:    "#202020",
  ivory:       "#F5F2EA",
  ivoryDim:    "#A8A49C",
  ivorySubtle: "#6B6760",
  emerald:     "#0F6B50",
  emeraldBright:"#17A77A",
  gold:        "#C88B3A",
  slate:       "#46505A",
  border:      "rgba(245,242,234,0.07)",
} as const;

const FREQ  = ["Weekly", "Biweekly", "Monthly"] as const;
const STATE = [
  { label: "Pending",   dot: T.ivorySubtle },
  { label: "Active",    dot: T.emeraldBright },
  { label: "Completed", dot: T.slate },
  { label: "Cancelled", dot: "#EF4444" },
] as const;

interface Props { address: `0x${string}`; }

export default function CircleCard({ address }: Props) {
  const navigate = useNavigate();

  const { data } = useReadContracts({
    contracts: [
      { address, abi: CIRCLE_ABI, functionName: "name" },
      { address, abi: CIRCLE_ABI, functionName: "state" },
      { address, abi: CIRCLE_ABI, functionName: "contributionAmount" },
      { address, abi: CIRCLE_ABI, functionName: "maxMembers" },
      { address, abi: CIRCLE_ABI, functionName: "getMemberCount" },
      { address, abi: CIRCLE_ABI, functionName: "getNextRotationTime" },
      { address, abi: CIRCLE_ABI, functionName: "frequency" },
      { address, abi: CIRCLE_ABI, functionName: "currentRound" },
    ],
  });

  const [circleName, state, amount, maxM, memberCount, nextRotation, freq, round] =
    data?.map(r => r.result) ?? [];

  if (!circleName) return <CircleCardSkeleton />;

  const stateNum  = Number(state ?? 0);
  const stateInfo = STATE[stateNum] ?? STATE[0];
  const isActive  = stateNum === 1;
  const contrib   = amount ? formatUnits(amount as bigint, 6) : "?";
  const totalPot  = amount && maxM
    ? Number(formatUnits((amount as bigint) * (maxM as bigint), 6)) : 0;
  const filled  = Number(memberCount ?? 0);
  const max     = Number(maxM ?? 1);
  const fillPct = Math.round((filled / max) * 100);
  const nextTime = nextRotation ? Number(nextRotation as bigint) * 1000 : 0;
  const hasNext  = isActive && nextTime > Date.now();

  return (
    <button
      onClick={() => navigate(`/app/circle/${address}`)}
      style={{
        display: "block", width: "100%", textAlign: "left",
        background: "none", border: "none", cursor: "pointer",
        padding: 0,
      }}
    >
      <div
        style={{
          background: T.surface1,
          border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "20px",
          transition: "border-color 0.2s, transform 0.15s",
        }}
        onMouseOver={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(245,242,234,0.14)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }}
        onMouseOut={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >

        {/* Name row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700, fontSize: 15,
              letterSpacing: "-0.02em",
              color: T.ivory, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{circleName as string}</h3>
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 5,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: stateInfo.dot, flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: T.ivorySubtle }}>
                {stateInfo.label} · {FREQ[Number(freq ?? 0)]} · Rd {Number(round ?? 0) + 1}
              </span>
            </div>
          </div>
          <ArrowUpRight size={14} color={T.ivorySubtle} style={{ flexShrink: 0, marginTop: 2 }} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(245,242,234,0.05)", marginBottom: 16 }} />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 10, color: T.ivorySubtle, letterSpacing: "0.06em", marginBottom: 4 }}>POT</p>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 14, fontWeight: 700,
              color: T.ivory, letterSpacing: "-0.02em",
            }}>${totalPot.toLocaleString()}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: T.ivorySubtle, letterSpacing: "0.06em", marginBottom: 4 }}>PER ROUND</p>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 14, fontWeight: 600,
              color: T.ivory,
            }}>${contrib}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: T.ivorySubtle, letterSpacing: "0.06em", marginBottom: 4 }}>
              {hasNext ? "NEXT" : "MEMBERS"}
            </p>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 13, fontWeight: 600,
              color: T.ivoryDim,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {hasNext
                ? <><Clock size={11} />{formatDistanceToNow(nextTime, { addSuffix: false })}</>
                : <><Users size={11} />{filled}/{max}</>
              }
            </p>
          </div>
        </div>

        {/* Fill bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: T.ivorySubtle }}>Members</span>
            <span style={{ fontSize: 10, color: T.ivorySubtle }}>{filled}/{max}</span>
          </div>
          <div style={{
            height: 3, borderRadius: 3,
            background: "rgba(245,242,234,0.06)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${fillPct}%`,
              background: isActive ? T.emerald : T.ivorySubtle,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>

      </div>
    </button>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
export function CircleCardSkeleton() {
  return (
    <div style={{
      background: T.surface1, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "20px",
    }}>
      <div className="shimmer" style={{ height: 18, borderRadius: 6, width: "55%", marginBottom: 8 }} />
      <div className="shimmer" style={{ height: 12, borderRadius: 4, width: "35%", marginBottom: 20 }} />
      <div style={{ height: 1, background: "rgba(245,242,234,0.04)", marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
        <div className="shimmer" style={{ height: 32, borderRadius: 6 }} />
        <div className="shimmer" style={{ height: 32, borderRadius: 6 }} />
        <div className="shimmer" style={{ height: 32, borderRadius: 6 }} />
      </div>
      <div className="shimmer" style={{ height: 3, borderRadius: 3 }} />
    </div>
  );
}
