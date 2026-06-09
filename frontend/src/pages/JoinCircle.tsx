import { useParams, useNavigate } from "react-router-dom";
import {
  useAccount, useReadContracts, useWriteContract,
  useWaitForTransactionReceipt, useChainId, useReadContract,
} from "wagmi";
import { formatUnits } from "viem";
import { CIRCLE_ABI, ERC20_ABI } from "../config/abis";
import { CONTRACTS } from "../config/wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { Loader2, CheckCircle2, Users, Zap, TrendingUp, ArrowLeft, Lock } from "lucide-react";

/* ─── tokens ─────────────────────────────────────────────── */
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
  borderMid:    "rgba(245,242,234,0.12)",
} as const;

const STATE_LABELS = ["Pending", "Active", "Completed", "Cancelled"];
const FREQ_LABELS  = ["Weekly",  "Biweekly", "Monthly"];

function StatRow({
  icon, label, value,
}: {
  icon: React.ReactNode; label: string; value: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0",
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 13, color: T.ivorySubtle,
      }}>
        {icon} {label}
      </div>
      <span style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 14, fontWeight: 600, color: T.ivory,
      }}>{value}</span>
    </div>
  );
}

export default function JoinCircle() {
  const { address: circleAddr } = useParams<{ address: `0x${string}` }>();
  const { address: userAddr }   = useAccount();
  const navigate  = useNavigate();
  const chainId   = useChainId();
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] ?? CONTRACTS[arbitrumSepolia.id];

  const { data } = useReadContracts({
    contracts: [
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "name" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "state" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "contributionAmount" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "maxMembers" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "getMemberCount" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "frequency" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "isMember", args: [userAddr!] },
    ],
    query: { enabled: !!circleAddr && !!userAddr },
  });

  const [name, state, amount, maxM, memberCount, freq, isMember] =
    data?.map((r) => r.result) ?? [];

  const { data: allowance } = useReadContract({
    address: contracts.usdc, abi: ERC20_ABI, functionName: "allowance",
    args: [userAddr!, circleAddr!],
    query: { enabled: !!userAddr && !!circleAddr },
  });

  const { writeContract: approve, data: approveTx, isPending: approving } = useWriteContract();
  const { writeContract: join,    data: joinTx,    isPending: joining    } = useWriteContract();
  const { isLoading: waitingApprove } = useWaitForTransactionReceipt({ hash: approveTx });
  const { isLoading: waitingJoin, isSuccess: joined } = useWaitForTransactionReceipt({ hash: joinTx });

  const contrib   = amount ? formatUnits(amount as bigint, 6) : "…";
  const spotsLeft = maxM && memberCount ? Number(maxM as bigint) - Number(memberCount as bigint) : null;
  const isFull    = spotsLeft === 0;
  const isActive  = Number(state ?? 0) > 0;
  const needsApprove = allowance !== undefined && amount !== undefined
    && (allowance as bigint) < (amount as bigint);
  const potTotal  = amount && maxM
    ? `$${formatUnits((amount as bigint) * (maxM as bigint), 6)}`
    : "…";

  /* ── Success state ── */
  if (joined || isMember) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 24px", textAlign: "center", gap: 20,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(15,107,80,0.12)",
          border: "1px solid rgba(23,167,122,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <CheckCircle2 size={32} color={T.emeraldBright} />
        </div>
        <div>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 24, fontWeight: 800,
            color: T.ivory, letterSpacing: "-0.02em",
            marginBottom: 8,
          }}>You're in the circle!</h2>
          <p style={{ fontSize: 14, color: T.ivorySubtle }}>
            Welcome to <strong style={{ color: T.ivory }}>{name as string}</strong>
          </p>
        </div>
        <button
          onClick={() => navigate(`/app/circle/${circleAddr}`)}
          style={{
            background: T.emerald, color: T.ivory,
            border: "none", borderRadius: 12,
            padding: "14px 32px",
            fontSize: 15, fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            cursor: "pointer", width: "100%", maxWidth: 320,
            transition: "background 0.2s",
          }}
          onMouseOver={e => (e.currentTarget.style.background = T.emeraldBright)}
          onMouseOut={e => (e.currentTarget.style.background = T.emerald)}
        >
          View My Circle
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 20px 60px", maxWidth: 480, margin: "0 auto" }}>

      {/* Back */}
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none",
        fontSize: 13, color: T.ivorySubtle, cursor: "pointer",
        fontFamily: "Space Grotesk, sans-serif",
        marginBottom: 24, padding: 0,
      }}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(200,139,58,0.10)",
          border: "1px solid rgba(200,139,58,0.22)",
          borderRadius: 20, padding: "3px 12px",
          fontSize: 11, fontWeight: 700,
          color: T.gold, letterSpacing: "0.06em",
          fontFamily: "Space Grotesk, sans-serif",
          marginBottom: 12,
        }}>
          JOIN CIRCLE
        </span>
        <h1 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 26, fontWeight: 900,
          color: T.ivory, letterSpacing: "-0.03em",
          marginBottom: 8,
        }}>{name as string ?? "Loading…"}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
            color: T.emeraldBright,
            background: "rgba(15,107,80,0.10)",
            border: "1px solid rgba(23,167,122,0.20)",
            borderRadius: 5, padding: "3px 9px",
          }}>{STATE_LABELS[Number(state ?? 0)]}</span>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
            color: T.ivoryDim,
            background: "rgba(245,242,234,0.05)",
            border: `1px solid ${T.border}`,
            borderRadius: 5, padding: "3px 9px",
          }}>{FREQ_LABELS[Number(freq ?? 0)]}</span>
        </div>
      </div>

      {/* Circle stats */}
      <div style={{
        background: T.surface1,
        border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "4px 20px 0",
        marginBottom: 16,
      }}>
        <StatRow icon={<Users size={14} />}     label="Spots remaining"   value={spotsLeft !== null ? `${spotsLeft} of ${Number(maxM ?? 0)}` : "…"} />
        <StatRow icon={<Zap size={14} />}        label="Your contribution"  value={`$${contrib} USDC`} />
        <StatRow icon={<TrendingUp size={14} />} label="Pot per rotation"   value={potTotal} />
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 0",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, color: T.ivorySubtle,
          }}>
            <span>🌱</span> Idle yield
          </div>
          <span style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 14, fontWeight: 600, color: T.emeraldBright,
          }}>Aave v3 (~3% APY)</span>
        </div>
      </div>

      {/* How it works */}
      <div style={{
        background: T.surface1,
        border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "20px",
        marginBottom: 20,
      }}>
        <p style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 13, fontWeight: 700,
          color: T.ivory, marginBottom: 16,
        }}>How this circle works</p>
        {[
          `Each member contributes $${contrib} USDC every ${FREQ_LABELS[Number(freq ?? 0)].toLowerCase()}`,
          "Contributions earn yield in Aave while the pot builds",
          `One member receives ${potTotal} USDC — selected fairly by Chainlink VRF`,
          "Chainlink Automation handles rotation automatically. No admin needed.",
        ].map((step, i) => (
          <div key={i} style={{
            display: "flex", gap: 12,
            paddingBottom: i < 3 ? 12 : 0,
            marginBottom: i < 3 ? 12 : 0,
            borderBottom: i < 3 ? `1px solid ${T.border}` : "none",
          }}>
            <span style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 12, fontWeight: 800,
              color: T.emeraldBright, flexShrink: 0,
              marginTop: 1,
            }}>{i + 1}.</span>
            <p style={{ fontSize: 13, color: T.ivoryDim, lineHeight: 1.6, margin: 0 }}>{step}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      {isFull || isActive ? (
        <div style={{
          textAlign: "center", padding: "20px",
          background: T.surface1, border: `1px solid ${T.border}`,
          borderRadius: 12,
        }}>
          <p style={{ fontSize: 14, color: T.ivorySubtle }}>
            {isFull
              ? "This circle is full — no spots remaining."
              : "This circle is already active. You can't join mid-cycle."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {needsApprove && (
            <button
              onClick={() => approve({
                address: contracts.usdc, abi: ERC20_ABI,
                functionName: "approve", args: [circleAddr!, amount as bigint],
              })}
              disabled={approving || waitingApprove}
              style={{
                width: "100%", background: T.gold,
                color: T.obsidian, border: "none", borderRadius: 12,
                padding: "14px", fontSize: 15, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                cursor: approving || waitingApprove ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: approving || waitingApprove ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {(approving || waitingApprove) && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              {approving ? "Confirm in wallet…" : waitingApprove ? "Approving…" : `Approve $${contrib} USDC`}
            </button>
          )}

          <button
            onClick={() => join({ address: circleAddr!, abi: CIRCLE_ABI, functionName: "join" })}
            disabled={joining || waitingJoin || needsApprove}
            style={{
              width: "100%",
              background: joining || waitingJoin || needsApprove
                ? "rgba(15,107,80,0.30)"
                : T.emerald,
              color: T.ivory, border: "none", borderRadius: 12,
              padding: "14px", fontSize: 15, fontWeight: 700,
              fontFamily: "Space Grotesk, sans-serif",
              cursor: joining || waitingJoin || needsApprove ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.2s",
            }}
            onMouseOver={e => {
              if (!joining && !waitingJoin && !needsApprove)
                (e.currentTarget as HTMLButtonElement).style.background = T.emeraldBright;
            }}
            onMouseOut={e => {
              if (!joining && !waitingJoin && !needsApprove)
                (e.currentTarget as HTMLButtonElement).style.background = T.emerald;
            }}
          >
            {(joining || waitingJoin) && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
            {joining ? "Confirm in wallet…" : waitingJoin ? "Joining…" : `Join & Deposit $${contrib} USDC`}
          </button>

          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, marginTop: 4,
          }}>
            <Lock size={11} color={T.ivorySubtle} />
            <p style={{ fontSize: 11, color: T.ivorySubtle, textAlign: "center" }}>
              Your ${contrib} is deposited immediately and starts earning Aave yield.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
