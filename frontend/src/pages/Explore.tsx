import { useChainId, useReadContract, useAccount } from "wagmi";
import { CIRCLE_FACTORY_ABI } from "../config/abis";
import { CONTRACTS } from "../config/wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import CircleCard, { CircleCardSkeleton } from "../components/CircleCard";
import { Link2, Wallet } from "lucide-react";

/* ─── design tokens ──────────────────────────────────────────── */
const T = {
  surface1:     "#181818",
  ivory:        "#F5F2EA",
  ivoryDim:     "#A8A49C",
  ivorySubtle:  "#6B6760",
  emerald:      "#0F6B50",
  emeraldBright:"#17A77A",
  gold:         "#C88B3A",
  border:       "rgba(245,242,234,0.07)",
} as const;

const SKELETONS = [0, 1, 2];

export default function Explore() {
  const { address, isConnected } = useAccount();
  const chainId   = useChainId();
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] ?? CONTRACTS[arbitrumSepolia.id];

  const { data: userCircles, isLoading } = useReadContract({
    address: contracts.factory,
    abi: CIRCLE_FACTORY_ABI,
    functionName: "getUserCircles",
    args: [address!],
    query: { enabled: !!address },
  });

  const circles = (userCircles as `0x${string}`[] | undefined) ?? [];

  /* ── Not connected ── */
  if (!isConnected) {
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
          Connect your wallet to view circles you've been invited to
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 20px 48px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(15,107,80,0.10)",
          border: "1px solid rgba(23,167,122,0.22)",
          borderRadius: 20, padding: "4px 12px",
          fontSize: 11, fontWeight: 700,
          color: T.emeraldBright,
          fontFamily: "Space Grotesk, sans-serif",
          letterSpacing: "0.06em",
          marginBottom: 14,
        }}>
          <Link2 size={11} /> MY CIRCLES
        </div>

        <h1 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 28, fontWeight: 900,
          color: T.ivory, letterSpacing: "-0.03em",
          margin: "0 0 8px",
        }}>Your Circles</h1>

        <p style={{ fontSize: 13, color: T.ivorySubtle, margin: 0 }}>
          {isLoading
            ? "Loading…"
            : `${circles.length} circle${circles.length !== 1 ? "s" : ""} — invite-only`}
        </p>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {SKELETONS.map(i => <CircleCardSkeleton key={i} />)}
        </div>
      ) : circles.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {circles.map(addr => (
            <CircleCard key={addr} address={addr} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "72px 24px", textAlign: "center", gap: 20,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(15,107,80,0.08)",
        border: "1px solid rgba(15,107,80,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Link2 size={28} color="rgba(23,167,122,0.55)" />
      </div>

      <div>
        <p style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 17, fontWeight: 700,
          color: T.ivory, marginBottom: 8,
        }}>No circles yet</p>
        <p style={{
          fontSize: 13, color: T.ivorySubtle,
          lineHeight: 1.65, maxWidth: 280,
        }}>
          Create a circle and invite your group, or ask someone to share their invite link with you.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <a href="/app/create" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: T.emerald, color: T.ivory,
          borderRadius: 10, padding: "10px 22px",
          fontSize: 13, fontWeight: 700,
          fontFamily: "Space Grotesk, sans-serif",
          textDecoration: "none",
          transition: "background 0.2s",
        }}
          onMouseOver={e => (e.currentTarget.style.background = T.emeraldBright)}
          onMouseOut={e => (e.currentTarget.style.background = T.emerald)}
        >
          Start a Circle
        </a>
      </div>
    </div>
  );
}
