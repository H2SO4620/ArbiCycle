import { useParams, useNavigate } from "react-router-dom";
import {
  useAccount, useReadContracts, useWriteContract,
  useWaitForTransactionReceipt, useChainId, useReadContract,
} from "wagmi";
import { formatUnits } from "viem";
import { CIRCLE_ABI, ERC20_ABI } from "../config/abis";
import { CONTRACTS } from "../config/wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import {
  Loader2, Share2, CheckCircle2, Clock,
  TrendingUp, Crown, Copy, AlertCircle, ArrowLeft, Wallet,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect, useRef } from "react";
import LivingCircle, { CircleMember } from "../components/LivingCircle";

/* ─── tokens ─────────────────────────────────────────────── */
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
  goldBright:  "#E8A84A",
  slate:       "#46505A",
  border:      "rgba(245,242,234,0.07)",
  borderMid:   "rgba(245,242,234,0.12)",
} as const;

const STATE_LABELS = ["Pending", "Active", "Completed", "Cancelled"];
const FREQ_LABELS  = ["Weekly", "Biweekly", "Monthly"];

const STATE_COLORS = [T.ivorySubtle, T.emeraldBright, T.slate, "#EF4444"];

/* ─── helpers ─────────────────────────────────────────────── */
function shortAddr(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}`; }

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: `${color}14`, border: `1px solid ${color}30`,
      borderRadius: 5, padding: "3px 9px",
      fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
      color,
    }}>{children}</span>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="stat-box" style={{
      background: T.surface1,
      border: `1px solid ${T.border}`,
      borderRadius: 12, padding: "16px 18px",
    }}>
      <p style={{ fontSize: 10, color: T.ivorySubtle, letterSpacing: "0.07em", marginBottom: 6 }}>{label}</p>
      <p className="stat-value" style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em",
        color: color ?? T.ivory, lineHeight: 1,
      }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: T.ivorySubtle, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function CircleDashboard() {
  const { address: circleAddr } = useParams<{ address: `0x${string}` }>();
  const { address: userAddr }   = useAccount();
  const navigate  = useNavigate();
  const chainId   = useChainId();
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] ?? CONTRACTS[arbitrumSepolia.id];
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVRFReveal, setShowVRFReveal] = useState(false);
  const circleWrapRef = useRef<HTMLDivElement>(null);
  const [circleSize, setCircleSize] = useState(360);

  useEffect(() => {
    function measure() {
      if (circleWrapRef.current) {
        const w = circleWrapRef.current.offsetWidth;
        setCircleSize(Math.min(360, w - 8));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { data, refetch } = useReadContracts({
    contracts: [
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "name" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "state" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "contributionAmount" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "maxMembers" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "getMemberCount" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "currentRound" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "getNextRotationTime" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "getCurrentPotValue" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "getCurrentRecipient" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "frequency" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "getAllMembers" },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "isMember",       args: [userAddr!] },
      { address: circleAddr!, abi: CIRCLE_ABI, functionName: "hasContributed", args: [userAddr!] },
    ],
    query: { enabled: !!circleAddr && !!userAddr },
  });

  const [
    name, state, amount, maxM, memberCount, round, nextRotation,
    potValue, recipient, freq, allMembers, isMember, hasContributed,
  ] = data?.map(r => r.result) ?? [];

  const { data: allowance } = useReadContract({
    address: contracts.usdc, abi: ERC20_ABI, functionName: "allowance",
    args: [userAddr!, circleAddr!],
    query: { enabled: !!userAddr && !!circleAddr },
  });

  const { writeContract: approve,    data: approveTx,    isPending: approving,    error: approveErr  } = useWriteContract();
  const { writeContract: contribute, data: contributeTx, isPending: contributing, error: contribErr  } = useWriteContract();
  const { writeContract: trigger,    data: triggerTx,    isPending: triggering,   error: triggerErr  } = useWriteContract();

  const { isLoading: waitApprove, isError: approveReverted } = useWaitForTransactionReceipt({ hash: approveTx });
  const { isLoading: waitContrib, isSuccess: contributed, isError: contribReverted } = useWaitForTransactionReceipt({
    hash: contributeTx, query: { onSettled: () => refetch() },
  });
  const { isLoading: waitTrigger, isSuccess: triggerDone, isError: triggerReverted } = useWaitForTransactionReceipt({
    hash: triggerTx, query: { onSettled: () => refetch() },
  });

  const txError = approveErr || contribErr || triggerErr;
  const txReverted = approveReverted || contribReverted || triggerReverted;

  /* Show VRF reveal overlay once trigger confirms */
  useEffect(() => {
    if (triggerDone) {
      setShowVRFReveal(true);
      const t = setTimeout(() => setShowVRFReveal(false), 5000);
      return () => clearTimeout(t);
    }
  }, [triggerDone]);

  const stateNum       = Number(state ?? 0);
  const isActive       = stateNum === 1;
  const contrib        = amount ? formatUnits(amount as bigint, 6) : "…";
  const pot            = potValue ? formatUnits(potValue as bigint, 6) : "0";
  const nextTime       = nextRotation ? Number(nextRotation as bigint) * 1000 : 0;
  const rotationDue    = nextTime > 0 && Date.now() >= nextTime;
  const needsApprove   = allowance !== undefined && amount !== undefined && (allowance as bigint) < (amount as bigint);
  const isRecipient    = recipient === userAddr;
  const filled         = Number(memberCount ?? 0);
  const max            = Number(maxM ?? 1);
  const joinLink       = `${window.location.origin}/join/${circleAddr}`;

  /* ── Yield calculation ── */
  const principal      = amount && memberCount
    ? parseFloat(formatUnits((amount as bigint) * BigInt(filled), 6))
    : 0;
  const potFloat       = parseFloat(pot);
  const yieldEarned    = potFloat > principal ? potFloat - principal : 0;
  const yieldPct       = principal > 0 ? ((yieldEarned / principal) * 100).toFixed(3) : "0";

  /* ── Build members for Living Circle ── */
  type RawMember = {
    addr: string;
    joinedAt: bigint;
    contributedAt: bigint;
    isActive: boolean;
    consecutiveMisses: number;
    totalContributed: bigint;
    hasContributedThisRound: boolean;
    hasReceived: boolean;
  };
  const rawMembers = (allMembers as RawMember[]) ?? [];
  const circleMembers: CircleMember[] = rawMembers.map((m, i) => ({
    addr:        m.addr,
    label:       m.addr === userAddr ? "You" : shortAddr(m.addr),
    contributed: m.hasContributedThisRound || (m.addr === userAddr && (hasContributed as boolean || contributed)),
    received:    m.hasReceived,
    isRecipient: m.addr === (recipient as string),
  }));

  function copyLink() {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  /* ── Disconnected guard ── */
  if (!userAddr) {
    return (
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(245,242,234,0.04)",
          border: "1px solid rgba(245,242,234,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
        }}>
          <Wallet size={26} color={T.ivorySubtle} />
        </div>
        <p style={{ fontSize: 15, color: T.ivory, marginBottom: 6 }}>Wallet not connected</p>
        <p style={{ fontSize: 13, color: T.ivorySubtle }}>Connect your wallet to view this circle.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @media (min-width: 900px) {
          .circle-layout        { display: grid !important; grid-template-columns: 1fr 380px !important; gap: 28px !important; align-items: start; }
          .cd-pad               { padding: 20px 24px 80px !important; }
        }
        @media (max-width: 480px) {
          .pot-value            { font-size: 40px !important; }
          .circle-header        { flex-direction: column !important; align-items: flex-start !important; }
          .circle-name          { font-size: 20px !important; }
          .stat-grid            { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
          .stat-box             { padding: 12px 14px !important; }
          .stat-value           { font-size: 17px !important; }
          .invite-btn           { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      {/* ── Back + Header ── */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate("/app")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none",
          fontSize: 13, color: T.ivorySubtle, cursor: "pointer",
          fontFamily: "Space Grotesk, sans-serif",
          marginBottom: 16, padding: 0,
        }}>
          <ArrowLeft size={14} /> Dashboard
        </button>

        <div className="circle-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, color: T.ivorySubtle, letterSpacing: "0.10em", marginBottom: 6 }}>CIRCLE</p>
            <h1 className="circle-name" style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 24, fontWeight: 700,
              letterSpacing: "-0.03em", color: T.ivory,
              marginBottom: 10,
            }}>{name as string ?? "Loading…"}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip color={STATE_COLORS[stateNum]}>{STATE_LABELS[stateNum]}</Chip>
              <Chip color={T.ivorySubtle}>{FREQ_LABELS[Number(freq ?? 0)]}</Chip>
              <Chip color={T.ivorySubtle}>Round {Number(round ?? 0) + 1}</Chip>
            </div>
          </div>
          <button className="invite-btn" onClick={() => setShowInvite(!showInvite)} style={{
            display: "flex", alignItems: "center", gap: 7,
            background: T.surface1, border: `1px solid ${T.border}`,
            borderRadius: 9, padding: "9px 16px",
            fontSize: 13, color: T.ivoryDim, cursor: "pointer",
            fontFamily: "Space Grotesk, sans-serif",
            transition: "border-color 0.2s",
          }}>
            <Share2 size={14} /> Invite Members
          </button>
        </div>
      </div>

      {/* ── Invite panel ── */}
      {showInvite && (
        <div style={{
          background: T.surface1, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "20px",
          marginBottom: 24,
        }}>
          <p style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 14, fontWeight: 600, color: T.ivory, marginBottom: 16,
          }}>Invite members</p>
          <div style={{ display: "flex", justifyContent: "center", padding: "16px", background: "rgba(245,242,234,0.03)", borderRadius: 10, marginBottom: 12 }}>
            <QRCodeSVG value={joinLink} size={140} bgColor="transparent" fgColor="#F5F2EA" />
          </div>
          <button onClick={copyLink} style={{
            width: "100%", background: T.emerald,
            color: T.ivory, border: "none", borderRadius: 9,
            padding: "11px", fontSize: 14, fontWeight: 600,
            fontFamily: "Space Grotesk, sans-serif",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 7, transition: "background 0.2s",
          }}>
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>
      )}

      {/* ── VRF Reveal Overlay ── */}
      {showVRFReveal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(17,17,17,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          animation: "fadeUp 0.4s ease",
        }}
          onClick={() => setShowVRFReveal(false)}
        >
          <div style={{
            background: "#141414",
            border: "1px solid rgba(200,139,58,0.30)",
            borderRadius: 22,
            padding: "40px 36px",
            maxWidth: 400, width: "90%",
            textAlign: "center",
            boxShadow: "0 0 80px rgba(200,139,58,0.12)",
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Spinning VRF icon */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(200,139,58,0.10)",
              border: "1px solid rgba(200,139,58,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <span style={{ fontSize: 32 }}>🎲</span>
            </div>

            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              color: T.gold, marginBottom: 10,
              fontFamily: "Space Grotesk, sans-serif",
            }}>CHAINLINK VRF</p>

            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 22, fontWeight: 900,
              color: T.ivory, letterSpacing: "-0.02em",
              marginBottom: 12,
            }}>Rotation Complete</h2>

            <p style={{
              fontSize: 14, color: T.ivoryDim,
              lineHeight: 1.65, marginBottom: 24,
            }}>
              Chainlink VRF selected the new recipient on-chain.
              The result is <strong style={{ color: T.ivory }}>tamper-proof</strong> and
              permanently verifiable.
            </p>

            {/* Recipient reveal */}
            {recipient && (
              <div style={{
                background: "rgba(200,139,58,0.08)",
                border: "1px solid rgba(200,139,58,0.25)",
                borderRadius: 12, padding: "14px 18px",
                marginBottom: 20,
              }}>
                <p style={{ fontSize: 11, color: T.ivorySubtle, marginBottom: 6, letterSpacing: "0.08em" }}>
                  NEW RECIPIENT
                </p>
                <p style={{
                  fontFamily: "monospace", fontSize: 13,
                  color: T.gold, wordBreak: "break-all",
                }}>
                  {recipient as string === userAddr
                    ? <span style={{ color: T.goldBright, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 16 }}>🏆 You!</span>
                    : shortAddr(recipient as string)
                  }
                </p>
              </div>
            )}

            <button
              onClick={() => setShowVRFReveal(false)}
              style={{
                width: "100%", background: T.emerald,
                color: T.ivory, border: "none", borderRadius: 10,
                padding: "12px", fontSize: 14, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = T.emeraldBright)}
              onMouseOut={e => (e.currentTarget.style.background = T.emerald)}
            >
              View Updated Circle
            </button>

            <p style={{ fontSize: 11, color: T.ivorySubtle, marginTop: 12 }}>
              Tap anywhere to dismiss
            </p>
          </div>
        </div>
      )}

      {/* ── TX error banner ── */}
      {(txError || txReverted) && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.22)",
          borderRadius: 10, padding: "12px 16px",
          display: "flex", alignItems: "flex-start", gap: 10,
          marginBottom: 16,
        }}>
          <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, color: "#EF4444", fontWeight: 600, marginBottom: 2 }}>Transaction failed</p>
            <p style={{ fontSize: 12, color: T.ivorySubtle, lineHeight: 1.5 }}>
              {txError?.message?.includes("rejected") || txError?.message?.includes("denied")
                ? "You rejected the transaction in your wallet."
                : txError?.message?.includes("insufficient")
                ? "Insufficient USDC balance to contribute."
                : "Transaction was rejected on-chain. Check your balance and try again."}
            </p>
          </div>
        </div>
      )}

      {/* ── Two-column layout: circle | right panel ── */}
      <div className="circle-layout" style={{ display: "block" }}>

        {/* ── LEFT: Living Circle ── */}
        <div>
          {/* Pot hero */}
          <div style={{
            background: T.surface1, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: "24px",
            marginBottom: 16,
            textAlign: "center",
          }}>
            <p style={{ fontSize: 11, color: T.ivorySubtle, letterSpacing: "0.10em", marginBottom: 8 }}>CURRENT POT</p>
            <p className="pot-value" style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 52, fontWeight: 700,
              letterSpacing: "-0.04em",
              color: T.gold, lineHeight: 1,
              marginBottom: 12,
            }}>${parseFloat(pot).toFixed(2)}</p>

            {/* Yield row */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(15,107,80,0.08)",
              border: "1px solid rgba(23,167,122,0.18)",
              borderRadius: 20, padding: "5px 14px",
              marginBottom: 10,
            }}>
              <TrendingUp size={12} color={T.emeraldBright} />
              {yieldEarned > 0 ? (
                <span style={{ fontSize: 12, color: T.emeraldBright, fontWeight: 600 }}>
                  +${yieldEarned.toFixed(4)} yield earned ({yieldPct}%)
                </span>
              ) : (
                <span style={{ fontSize: 12, color: T.emeraldBright, fontWeight: 500 }}>
                  Earning yield on Aave v3
                </span>
              )}
            </div>

            {/* Principal breakdown */}
            {principal > 0 && (
              <p style={{ fontSize: 11, color: T.ivorySubtle, marginBottom: 8 }}>
                ${principal.toFixed(2)} principal · ${yieldEarned.toFixed(4)} interest
              </p>
            )}

            {isActive && nextTime > 0 && (
              <p style={{ fontSize: 13, color: T.ivorySubtle }}>
                {rotationDue
                  ? <span style={{ color: T.emeraldBright, fontWeight: 600 }}>Rotation ready to trigger!</span>
                  : <>Next payout in {formatDistanceToNow(nextTime)}</>
                }
              </p>
            )}
          </div>

          {/* The Living Circle — THE centrepiece */}
          <div ref={circleWrapRef} style={{
            background: T.surface1, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: "16px",
            display: "flex", justifyContent: "center",
          }}>
            {circleMembers.length > 0 ? (
              <LivingCircle
                members={circleMembers}
                potValue={`$${parseFloat(pot).toFixed(0)}`}
                size={circleSize}
                showGuardian={isActive}
                animate={true}
                round={Number(round ?? 0) + 1}
              />
            ) : (
              <CirclePlaceholder />
            )}
          </div>
        </div>

        {/* ── RIGHT: Info panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>

          {/* Stats */}
          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <StatBox label="MEMBERS"     value={`${filled}/${max}`} />
            <StatBox label="PER ROUND"   value={`$${contrib}`} />
            <StatBox
              label="NEXT DATE"
              value={isActive && nextTime > 0 ? format(nextTime, "MMM d") : "—"}
              sub={isActive && nextTime > 0 ? format(nextTime, "yyyy") : undefined}
            />
            <StatBox
              label="GUARDIAN"
              value={isActive ? "Active" : "Idle"}
              color={isActive ? T.emeraldBright : T.ivorySubtle}
            />
          </div>

          {/* User status */}
          {isMember && isActive && (
            <div style={{
              background: isRecipient
                ? "rgba(200,139,58,0.07)"
                : (hasContributed as boolean || contributed)
                ? "rgba(15,107,80,0.07)"
                : "rgba(239,68,68,0.06)",
              border: `1px solid ${isRecipient ? "rgba(200,139,58,0.25)" : (hasContributed as boolean || contributed) ? "rgba(15,107,80,0.22)" : "rgba(239,68,68,0.20)"}`,
              borderRadius: 12, padding: "16px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: isRecipient ? "rgba(200,139,58,0.15)"
                  : (hasContributed as boolean || contributed) ? "rgba(15,107,80,0.12)"
                  : "rgba(239,68,68,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {isRecipient
                  ? <Crown size={16} color={T.gold} />
                  : (hasContributed as boolean || contributed)
                  ? <CheckCircle2 size={16} color={T.emeraldBright} />
                  : <AlertCircle size={16} color="#EF4444" />
                }
              </div>
              <div>
                <p style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 14, fontWeight: 600, color: T.ivory, marginBottom: 3,
                }}>
                  {isRecipient ? "You receive this round 🎉"
                   : (hasContributed as boolean || contributed) ? "Contribution complete"
                   : "Contribution needed"}
                </p>
                <p style={{ fontSize: 12, color: T.ivorySubtle, lineHeight: 1.5 }}>
                  {isRecipient
                    ? `You'll receive ~$${(parseFloat(contrib) * filled).toFixed(0)} USDC`
                    : (hasContributed as boolean || contributed)
                    ? "You're all set for this round"
                    : `Contribute $${contrib} USDC before the deadline`}
                </p>
              </div>
            </div>
          )}

          {/* Approve + Contribute */}
          {isMember && isActive && !isRecipient && !(hasContributed as boolean || contributed) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {needsApprove && (
                <button
                  disabled={approving || waitApprove}
                  onClick={() => approve({
                    address: contracts.usdc, abi: ERC20_ABI,
                    functionName: "approve", args: [circleAddr!, amount as bigint],
                    gas: 100_000n,
                  })}
                  style={{
                    width: "100%", background: T.gold,
                    color: T.obsidian, border: "none", borderRadius: 10,
                    padding: "13px", fontSize: 15, fontWeight: 700,
                    fontFamily: "Space Grotesk, sans-serif",
                    cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: (approving || waitApprove) ? 0.6 : 1,
                  }}
                >
                  {(approving || waitApprove) && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  Approve USDC
                </button>
              )}
              <button
                disabled={contributing || waitContrib || needsApprove}
                onClick={() => contribute({
                  address: circleAddr!, abi: CIRCLE_ABI, functionName: "contribute",
                  gas: 800_000n,
                })}
                style={{
                  width: "100%", background: T.emerald,
                  color: T.ivory, border: "none", borderRadius: 10,
                  padding: "13px", fontSize: 15, fontWeight: 700,
                  fontFamily: "Space Grotesk, sans-serif",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: (contributing || waitContrib || needsApprove) ? 0.55 : 1,
                  transition: "background 0.2s",
                }}
              >
                {(contributing || waitContrib) && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                Contribute ${contrib} USDC
              </button>
            </div>
          )}

          {/* Trigger rotation */}
          {isActive && rotationDue && (
            <button
              disabled={triggering || waitTrigger}
              onClick={() => trigger({ address: circleAddr!, abi: CIRCLE_ABI, functionName: "triggerRotation", gas: 1_200_000n })}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #17A77A, #0F6B50)",
                color: T.ivory, border: "none", borderRadius: 10,
                padding: "13px", fontSize: 15, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 8,
                opacity: (triggering || waitTrigger) ? 0.6 : 1,
              }}
            >
              {(triggering || waitTrigger) && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              <Clock size={15} /> Trigger Rotation
            </button>
          )}

          {/* Join prompt */}
          {!isMember && stateNum === 0 && (
            <button onClick={() => navigate(`/app/join/${circleAddr}`)} style={{
              width: "100%", background: T.emerald,
              color: T.ivory, border: "none", borderRadius: 10,
              padding: "14px", fontSize: 15, fontWeight: 700,
              fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
            }}>
              Join This Circle
            </button>
          )}

          {/* Members list */}
          <MembersList
            members={rawMembers}
            recipient={recipient as string}
            userAddr={userAddr}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Members list ───────────────────────────────────────── */
function MembersList({
  members, recipient, userAddr,
}: {
  members: Array<{ addr: string; hasContributedThisRound: boolean; hasReceived: boolean; isActive?: boolean }>;
  recipient: string;
  userAddr?: string;
}) {
  if (!members.length) return null;
  return (
    <div>
      <p style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 13, fontWeight: 600,
        color: T.ivory, marginBottom: 10,
      }}>Members ({members.length})</p>
      <div style={{
        background: T.surface1, border: `1px solid ${T.border}`,
        borderRadius: 12, overflow: "hidden",
      }}>
        {members.map((m, i) => {
          const isMe  = m.addr === userAddr;
          const isRec = m.addr === recipient;
          return (
            <div key={m.addr} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px",
              borderBottom: i < members.length - 1 ? `1px solid ${T.border}` : "none",
              background: isRec ? "rgba(200,139,58,0.04)" : "transparent",
              opacity: m.isActive === false ? 0.45 : 1,
            }}>
              {/* Position badge */}
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: isRec ? "rgba(200,139,58,0.18)" : "rgba(245,242,234,0.05)",
                border: `1px solid ${isRec ? "rgba(200,139,58,0.40)" : "rgba(245,242,234,0.10)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                color: isRec ? T.gold : T.ivorySubtle,
                flexShrink: 0,
              }}>{i + 1}</div>

              {/* Address */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: isMe ? 600 : 400,
                  color: isMe ? T.ivory : T.ivoryDim,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: "monospace",
                }}>
                  {isMe ? "You" : shortAddr(m.addr)}
                </p>
                {isRec && (
                  <p style={{ fontSize: 10, color: T.gold, marginTop: 2, letterSpacing: "0.06em" }}>
                    RECIPIENT
                  </p>
                )}
                {m.hasReceived && (
                  <p style={{ fontSize: 10, color: T.emeraldBright, marginTop: 2 }}>Received ✓</p>
                )}
              </div>

              {/* Contribution status */}
              {m.hasContributedThisRound
                ? <CheckCircle2 size={14} color={T.emeraldBright} style={{ flexShrink: 0 }} />
                : <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "1.5px solid rgba(245,242,234,0.15)",
                    flexShrink: 0,
                  }} />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Empty circle placeholder ───────────────────────────── */
function CirclePlaceholder() {
  return (
    <div style={{ textAlign: "center", padding: "40px 0", color: T.ivorySubtle }}>
      <svg viewBox="0 0 200 200" width="200" height="200" style={{ opacity: 0.4 }}>
        <circle cx="100" cy="100" r="80" fill="none" stroke={T.ivorySubtle} strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="100" cy="100" r="8" fill={T.gold} opacity="0.5" />
      </svg>
      <p style={{ fontSize: 13, marginTop: 8 }}>Loading circle data…</p>
    </div>
  );
}

/* (spin keyframe lives in index.css) */
