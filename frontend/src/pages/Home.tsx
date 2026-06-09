import { useNavigate } from "react-router-dom";
import { useAccount, useReadContract, useChainId } from "wagmi";
import { CIRCLE_FACTORY_ABI } from "../config/abis";
import { CONTRACTS } from "../config/wagmi";
import CircleCard, { CircleCardSkeleton } from "../components/CircleCard";
import { Plus, ArrowRight, Wallet } from "lucide-react";
import { arbitrumSepolia } from "wagmi/chains";
import LivingCircle, { DEMO_MEMBERS } from "../components/LivingCircle";

/* ─── design tokens ──────────────────────────────────────── */
const T = {
  obsidian:    "#111111",
  surface1:    "#181818",
  surface2:    "#202020",
  ivory:       "#F5F2EA",
  ivoryDim:    "#A8A49C",
  ivorySubtle: "#6B6760",
  emerald:     "#0F6B50",
  emeraldBright:"#17A77A",
  gold:        "#C88B3A",
  border:      "rgba(245,242,234,0.07)",
} as const;

/* ─── stat chip ──────────────────────────────────────────── */
function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      background: T.surface1,
      border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "16px 20px",
    }}>
      <p style={{ fontSize: 11, color: T.ivorySubtle, letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
      <p style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em",
        color: accent ? T.gold : T.ivory, lineHeight: 1,
      }}>{value}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const chainId  = useChainId();
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] ?? CONTRACTS[arbitrumSepolia.id];

  const { data: userCircles, isLoading: loadingMine } = useReadContract({
    address: contracts.factory,
    abi: CIRCLE_FACTORY_ABI,
    functionName: "getUserCircles",
    args: [address!],
    query: { enabled: !!address },
  });

  const { data: allCircles, isLoading: loadingAll } = useReadContract({
    address: contracts.factory,
    abi: CIRCLE_FACTORY_ABI,
    functionName: "getAllCircles",
    query: { enabled: isConnected },
  });

  const { data: totalCount } = useReadContract({
    address: contracts.factory,
    abi: CIRCLE_FACTORY_ABI,
    functionName: "getCircleCount",
    query: { enabled: isConnected },
  });

  const myCircles      = (userCircles as `0x${string}`[]) ?? [];
  const publicCircles  = (allCircles  as `0x${string}`[]) ?? [];
  const total          = Number(totalCount ?? 0);

  /* ════ NOT CONNECTED ══════════════════════════════════════ */
  if (!isConnected) {
    return (
      <div style={{ padding: "24px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        <style>{`
          @media (min-width: 768px) { .home-two-col { flex-direction: row !important; } }
        `}</style>

        {/* Connect bar */}
        <div style={{
          background: "rgba(15,107,80,0.06)",
          border: "1px solid rgba(15,107,80,0.20)",
          borderRadius: 12, padding: "14px 18px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 40,
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={15} color={T.ivorySubtle} />
            <span style={{ fontSize: 14, color: T.ivoryDim }}>
              Connect your wallet to create or join a circle
            </span>
          </div>
          <span style={{ fontSize: 12, color: T.ivorySubtle }}>Use the wallet button above →</span>
        </div>

        {/* Hero: circle + headline */}
        <div className="home-two-col" style={{
          display: "flex", gap: 64, alignItems: "center",
          flexDirection: "column", marginBottom: 60,
        }}>
          {/* Left: circle */}
          <div style={{ flex: "0 0 320px", maxWidth: 320 }}>
            <LivingCircle
              members={DEMO_MEMBERS}
              potValue="$1,200"
              size={320}
              showGuardian={true}
              animate={true}
              round={3}
            />
          </div>
          {/* Right: text */}
          <div style={{ flex: "1 1 320px" }}>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 11, fontWeight: 600,
              color: T.gold, letterSpacing: "0.12em",
              marginBottom: 14,
            }}>WEALTH MOVES IN CIRCLES</p>
            <h1 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 36, fontWeight: 700,
              letterSpacing: "-0.035em", lineHeight: 1.15,
              color: T.ivory, marginBottom: 16,
            }}>
              Trustless savings circles<br />
              <span style={{ color: T.gold }}>for your community.</span>
            </h1>
            <p style={{ fontSize: 15, color: T.ivoryDim, lineHeight: 1.75, marginBottom: 28 }}>
              Connect your wallet to create a savings circle,
              invite your group, and let the protocol handle the rest.
              No coordinator. No disputes. No missing money.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/app/create")} style={{
                background: T.emerald, color: T.ivory,
                border: "none", borderRadius: 9,
                padding: "12px 24px", fontSize: 14, fontWeight: 600,
                fontFamily: "Space Grotesk, sans-serif",
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <Plus size={14} /> Start a Circle
              </button>
            </div>
          </div>
        </div>

        {/* Trust points */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}>
          {[
            { icon: "🔐", label: "No coordinator",    sub: "Smart contract rules, not people" },
            { icon: "🎲", label: "Provably fair",      sub: "Chainlink VRF picks rotation order" },
            { icon: "🌱", label: "Idle yield",         sub: "Contributions earn on Aave v3" },
            { icon: "⚡", label: "Self-executing",     sub: "Chainlink Automation triggers rounds" },
          ].map(({ icon, label, sub }) => (
            <div key={label} style={{
              background: T.surface1,
              border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "18px 20px",
            }}>
              <span style={{ fontSize: 22 }}>{icon}</span>
              <p style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 14, fontWeight: 700,
                color: T.ivory, marginTop: 10, marginBottom: 4,
              }}>{label}</p>
              <p style={{ fontSize: 12, color: T.ivorySubtle, lineHeight: 1.5 }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ════ CONNECTED ══════════════════════════════════════════ */
  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @media (min-width: 768px) { .home-two-col { flex-direction: row !important; } }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 26, fontWeight: 700,
          letterSpacing: "-0.03em", color: T.ivory,
          marginBottom: 4,
        }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: T.ivorySubtle }}>
          {address?.slice(0, 6)}…{address?.slice(-4)} · Arbitrum Sepolia
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 10, marginBottom: 36,
      }}>
        <StatChip label="MY CIRCLES"    value={loadingMine ? "—" : myCircles.length.toString()} />
        <StatChip label="TOTAL ON-CHAIN" value={total.toString()} />
        <StatChip label="YIELD SOURCE"  value="Aave v3" accent />
        <StatChip label="PROTOCOL FEE"  value="None" />
      </div>

      {/* ── My circles ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 16,
        }}>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 17, fontWeight: 700,
            letterSpacing: "-0.025em", color: T.ivory,
          }}>My Circles</h2>
          <button onClick={() => navigate("/app/create")} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: T.emerald, color: T.ivory,
            border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 600,
            fontFamily: "Space Grotesk, sans-serif",
            cursor: "pointer", transition: "background 0.2s",
          }}>
            <Plus size={13} /> New Circle
          </button>
        </div>

        {loadingMine ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            <CircleCardSkeleton /><CircleCardSkeleton />
          </div>
        ) : myCircles.length === 0 ? (
          <MyCirclesEmpty />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {myCircles.map(addr => <CircleCard key={addr} address={addr} />)}
          </div>
        )}
      </section>

      {/* ── Discover ── */}
      {total > myCircles.length && (
        <section>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 6,
          }}>
            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 17, fontWeight: 700,
              letterSpacing: "-0.025em", color: T.ivory,
            }}>Discover</h2>
            <button onClick={() => navigate("/app/explore")} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 13, color: T.ivorySubtle,
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "Space Grotesk, sans-serif",
            }}>
              All circles <ArrowRight size={13} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: T.ivorySubtle, marginBottom: 16 }}>
            Open circles you can join
          </p>

          {/* Teaser card */}
          <div style={{
            background: T.surface1,
            border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "20px 24px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 16,
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(15,107,80,0.12)",
                border: "1px solid rgba(15,107,80,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Compass size={18} color={T.emeraldBright} />
              </div>
              <div>
                <p style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 15, fontWeight: 600, color: T.ivory,
                }}>
                  {total - myCircles.length} circle{total - myCircles.length !== 1 ? "s" : ""} to explore
                </p>
                <p style={{ fontSize: 13, color: T.ivorySubtle, marginTop: 2 }}>
                  Find a group that fits your savings goal
                </p>
              </div>
            </div>
            <button onClick={() => navigate("/app/explore")} style={{
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.ivoryDim, borderRadius: 8,
              padding: "9px 18px", fontSize: 13, fontWeight: 500,
              fontFamily: "Space Grotesk, sans-serif",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s",
            }}>
              Browse <ArrowRight size={13} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── empty states ───────────────────────────────────────── */
function MyCirclesEmpty() {
  const navigate = useNavigate();
  return (
    <div style={{
      background: T.surface1,
      border: `1px dashed rgba(245,242,234,0.10)`,
      borderRadius: 16, padding: "48px 24px",
      textAlign: "center",
    }}>
      {/* Mini circle graphic */}
      <div style={{ width: 80, height: 80, margin: "0 auto 20px" }}>
        <svg viewBox="0 0 80 80" fill="none" width="80" height="80">
          <circle cx="40" cy="40" r="34" stroke="rgba(15,107,80,0.25)" strokeWidth="1" strokeDasharray="3 5" />
          <circle cx="40" cy="40" r="20" fill="rgba(15,107,80,0.07)" />
          <circle cx="40" cy="40" r="6"  fill="#C88B3A" opacity="0.7" />
        </svg>
      </div>
      <p style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 16, fontWeight: 600,
        color: T.ivory, marginBottom: 8,
      }}>No circles yet</p>
      <p style={{ fontSize: 14, color: T.ivorySubtle, maxWidth: 280, margin: "0 auto 24px", lineHeight: 1.65 }}>
        Create your first savings circle or browse existing ones to join.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => navigate("/app/create")} style={{
          background: T.emerald, color: T.ivory, border: "none",
          borderRadius: 9, padding: "11px 22px",
          fontSize: 14, fontWeight: 600,
          fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Plus size={14} /> Create Circle
        </button>
        <button onClick={() => navigate("/app/explore")} style={{
          background: "transparent", color: T.ivoryDim,
          border: `1px solid ${T.border}`,
          borderRadius: 9, padding: "11px 22px",
          fontSize: 14, fontWeight: 500,
          fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Compass size={14} /> Explore
        </button>
      </div>
    </div>
  );
}

