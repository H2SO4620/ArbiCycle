import { useAccount, useReadContract, useChainId } from "wagmi";
import { REPUTATION_ABI } from "../config/abis";
import { CONTRACTS } from "../config/wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { ShieldCheck, TrendingUp, Clock, XCircle, Award, Wallet, User } from "lucide-react";
import { Progress } from "../components/ui/progress";
import { EmblemIcon } from "../components/Logo";

/* ─── design tokens ───────────────────────────────────────────── */
const T = {
  obsidian:     "#111111",
  surface1:     "#181818",
  surface2:     "#202020",
  ivory:        "#F5F2EA",
  ivoryDim:     "#A8A49C",
  ivorySubtle:  "#6B6760",
  emerald:      "#0F6B50",
  emeraldBright:"#17A77A",
  gold:         "#C88B3A",
  goldBright:   "#E8A84A",
  border:       "rgba(245,242,234,0.07)",
  borderMid:    "rgba(245,242,234,0.11)",
} as const;

/* ─── tier definitions ────────────────────────────────────────── */
const TIERS = [
  { min: 0,   label: "New Member", color: T.ivorySubtle,   bg: "rgba(245,242,234,0.06)",  border: "rgba(245,242,234,0.10)" },
  { min: 200, label: "Reliable",   color: T.ivoryDim,      bg: "rgba(245,242,234,0.08)",  border: "rgba(245,242,234,0.14)" },
  { min: 400, label: "Trusted",    color: T.emeraldBright, bg: "rgba(15,107,80,0.10)",    border: "rgba(23,167,122,0.25)"  },
  { min: 600, label: "Respected",  color: T.gold,          bg: "rgba(200,139,58,0.10)",   border: "rgba(200,139,58,0.25)"  },
  { min: 800, label: "Champion",   color: T.goldBright,    bg: "rgba(232,168,74,0.12)",   border: "rgba(232,168,74,0.30)"  },
];

function getTier(score: number) {
  return [...TIERS].reverse().find((t) => score >= t.min) ?? TIERS[0];
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

/* ─── stat card ──────────────────────────────────────────────── */
function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  return (
    <div style={{
      background: T.surface1,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: "16px 18px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
        color, marginBottom: 8,
        fontFamily: "Space Grotesk, sans-serif",
      }}>
        {icon} {label.toUpperCase()}
      </div>
      <p style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 28, fontWeight: 800,
        color: T.ivory, lineHeight: 1,
      }}>{value}</p>
    </div>
  );
}

/* ─── scoring rule row ────────────────────────────────────────── */
function RuleRow({ pts, label, color }: { pts: string; label: string; color: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ fontSize: 13, color: T.ivorySubtle }}>{label}</span>
      <span style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontWeight: 800, fontSize: 14,
        color, letterSpacing: "-0.01em",
      }}>{pts}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { address } = useAccount();
  const chainId = useChainId();
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] ?? CONTRACTS[arbitrumSepolia.id];

  const { data: stats } = useReadContract({
    address: contracts.reputation,
    abi: REPUTATION_ABI,
    functionName: "getStats",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: lendingLimit } = useReadContract({
    address: contracts.reputation,
    abi: REPUTATION_ABI,
    functionName: "getLendingLimit",
    args: [address!],
    query: { enabled: !!address },
  });

  /* ── not connected ── */
  if (!address) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 24px", gap: 16, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(245,242,234,0.04)",
          border: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Wallet size={26} color={T.ivorySubtle} />
        </div>
        <p style={{ fontSize: 14, color: T.ivorySubtle, maxWidth: 260 }}>
          Connect your wallet to view your on-chain reputation
        </p>
      </div>
    );
  }

  const [score, totalContribs, onTime, late, missed] =
    (stats as [bigint, bigint, bigint, bigint, bigint, bigint] | undefined)
    ?? [100n, 0n, 0n, 0n, 0n, 0n];

  const scoreNum   = Number(score ?? 100n);
  const tier       = getTier(scoreNum);
  const pct        = Math.min((scoreNum / 1000) * 100, 100);
  const limit      = Number(lendingLimit ?? 0n);
  const nextTier   = TIERS.find(t => t.min > scoreNum);

  const progressColor = scoreNum >= 600 ? "gold" : "emerald";

  return (
    <div style={{ padding: "24px 20px 48px", maxWidth: 640 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: T.emerald,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={18} color={T.ivory} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 20, fontWeight: 800,
              color: T.ivory, letterSpacing: "-0.02em",
              margin: 0,
            }}>My Profile</h1>
            <p style={{ fontSize: 11, color: T.ivorySubtle, fontFamily: "monospace", margin: 0 }}>
              {shortAddr(address)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Score hero ── */}
      <div style={{
        background: T.surface1,
        border: `1px solid ${tier.border}`,
        borderRadius: 18,
        padding: "24px",
        marginBottom: 16,
        boxShadow: `0 0 32px ${tier.bg}`,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.10em",
              color: T.ivorySubtle, marginBottom: 4,
              fontFamily: "Space Grotesk, sans-serif",
            }}>REPUTATION SCORE</p>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 56, fontWeight: 900,
              color: T.ivory, lineHeight: 1,
              letterSpacing: "-0.03em",
            }}>{scoreNum}</p>
            <p style={{ fontSize: 11, color: T.ivorySubtle, marginTop: 4 }}>out of 1000</p>
          </div>

          {/* Tier badge */}
          <div style={{
            background: tier.bg,
            border: `1px solid ${tier.border}`,
            borderRadius: 24,
            padding: "6px 14px",
            fontSize: 12, fontWeight: 700,
            color: tier.color,
            fontFamily: "Space Grotesk, sans-serif",
            letterSpacing: "0.02em",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <ShieldCheck size={12} />
            {tier.label}
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={pct} color={progressColor} className="h-2.5" />
        <div style={{
          display: "flex", justifyContent: "space-between",
          marginTop: 8, fontSize: 11, color: T.ivorySubtle,
          fontFamily: "Space Grotesk, sans-serif",
        }}>
          <span>0</span>
          {nextTier ? (
            <span style={{ color: tier.color, fontWeight: 600 }}>
              {nextTier.min - scoreNum} pts to {nextTier.label}
            </span>
          ) : (
            <span style={{ color: T.goldBright, fontWeight: 600 }}>Max tier reached 🏆</span>
          )}
          <span>1000</span>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 12, marginBottom: 16,
      }}>
        <StatCard icon={<ShieldCheck size={13} />} label="On-time"  value={String(Number(onTime ?? 0n))}        color={T.emeraldBright} />
        <StatCard icon={<TrendingUp  size={13} />} label="Total"    value={String(Number(totalContribs ?? 0n))} color={T.ivoryDim}      />
        <StatCard icon={<Clock       size={13} />} label="Late"     value={String(Number(late ?? 0n))}          color="#FBBF24"         />
        <StatCard icon={<XCircle     size={13} />} label="Missed"   value={String(Number(missed ?? 0n))}        color="#F87171"         />
      </div>

      {/* ── Micro-lending access ── */}
      <div style={{
        background: limit > 0 ? "rgba(15,107,80,0.07)" : T.surface1,
        border: `1px solid ${limit > 0 ? "rgba(23,167,122,0.22)" : T.border}`,
        borderRadius: 16, padding: "20px", marginBottom: 16,
      }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={15} color={limit > 0 ? T.emeraldBright : T.ivorySubtle} />
            <span style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 14, fontWeight: 700, color: T.ivory,
            }}>Micro-lending Access</span>
          </div>
          {limit > 0 && (
            <span style={{
              background: "rgba(23,167,122,0.12)",
              border: "1px solid rgba(23,167,122,0.25)",
              borderRadius: 20, padding: "3px 10px",
              fontSize: 11, fontWeight: 700,
              color: T.emeraldBright,
              fontFamily: "Space Grotesk, sans-serif",
            }}>Eligible</span>
          )}
        </div>
        <div style={{ height: 1, background: T.border, marginBottom: 12 }} />
        {limit > 0 ? (
          <div>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 24, fontWeight: 800,
              color: T.emeraldBright, letterSpacing: "-0.02em",
            }}>{limit}× contribution</p>
            <p style={{ fontSize: 12, color: T.ivorySubtle, marginTop: 6, lineHeight: 1.6 }}>
              Your reputation qualifies you for collateral-free micro-loans across ArbiCycle circles.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: T.ivoryDim, fontWeight: 500 }}>Not yet eligible</p>
            <p style={{ fontSize: 12, color: T.ivorySubtle, marginTop: 6, lineHeight: 1.6 }}>
              Reach a score of 300+ with consistent on-time payments to unlock lending access.
            </p>
          </div>
        )}
      </div>

      {/* ── How scoring works ── */}
      <div style={{
        background: T.surface1,
        border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "20px",
      }}>
        <p style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 13, fontWeight: 700, color: T.ivory,
          marginBottom: 4,
        }}>How scoring works</p>
        <p style={{ fontSize: 11, color: T.ivorySubtle, marginBottom: 16 }}>
          Your score is recorded on-chain by the ReputationModule contract.
        </p>
        <RuleRow pts="+10" label="On-time contribution"     color={T.emeraldBright} />
        <RuleRow pts="+50" label="Received rotation payout" color={T.goldBright}    />
        <RuleRow pts="−20" label="Late payment"             color="#FBBF24"         />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10 }}>
          <span style={{ fontSize: 13, color: T.ivorySubtle }}>Missed payment</span>
          <span style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: 14, color: "#F87171",
          }}>−80</span>
        </div>
      </div>

    </div>
  );
}
