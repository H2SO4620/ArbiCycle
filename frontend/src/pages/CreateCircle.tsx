import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useWriteContract, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, decodeEventLog } from "viem";
import { CIRCLE_FACTORY_ABI } from "../config/abis";
import { CONTRACTS } from "../config/wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { Loader2, CheckCircle2, Copy, Info } from "lucide-react";

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
  border:      "rgba(245,242,234,0.08)",
  borderFocus: "rgba(15,107,80,0.40)",
} as const;

const FREQ_OPTIONS = [
  { label: "Weekly",    sub: "Good for small groups",   value: 0 },
  { label: "Biweekly", sub: "Balanced savings pace",    value: 1 },
  { label: "Monthly",  sub: "Larger contributions",     value: 2 },
];

const QUICK_SIZES = [3, 5, 10, 15, 20];

/* ─── sub-components ─────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 13, fontWeight: 600,
          color: T.ivory,
        }}>{label}</label>
        {hint && <span style={{ fontSize: 12, color: T.ivorySubtle }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: T.ivorySubtle }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: accent ? T.gold : T.ivory,
      }}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function CreateCircle() {
  const navigate  = useNavigate();
  const { address } = useAccount();
  const chainId   = useChainId();
  const contracts = CONTRACTS[chainId as keyof typeof CONTRACTS] ?? CONTRACTS[arbitrumSepolia.id];
  const [copied, setCopied]   = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", contribution: "50", maxMembers: "5", frequency: 0,
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  const newCircle = (() => {
    if (!isSuccess || !receipt) return null;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: CIRCLE_FACTORY_ABI, ...log });
        if (decoded.eventName === "CircleCreated")
          return (decoded.args as { circle: `0x${string}` }).circle;
      } catch {}
    }
    return null;
  })();

  function submit() {
    if (!address) return;
    writeContract({
      address: contracts.factory, abi: CIRCLE_FACTORY_ABI,
      functionName: "createCircle",
      args: [form.name, parseUnits(form.contribution, 6), BigInt(form.maxMembers), form.frequency],
    });
  }

  const potTotal = (parseFloat(form.contribution) || 0) * (parseInt(form.maxMembers) || 0);
  const valid    = form.name.trim().length > 0 && parseFloat(form.contribution) >= 1 && parseInt(form.maxMembers) >= 3;
  const busy     = isPending || isConfirming;

  /* ── Success screen ── */
  if (isSuccess && newCircle) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px", textAlign: "center" }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(15,107,80,0.12)",
          border: "1px solid rgba(15,107,80,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <CheckCircle2 size={32} color={T.emeraldBright} />
        </div>

        <h2 style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 24, fontWeight: 700,
          letterSpacing: "-0.03em", color: T.ivory,
          marginBottom: 6,
        }}>Circle Created</h2>
        <p style={{ fontSize: 14, color: T.ivorySubtle, marginBottom: 28 }}>
          Share this address so members can join
        </p>

        {/* Address */}
        <div style={{
          background: T.surface1,
          border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "16px",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: T.ivorySubtle, letterSpacing: "0.08em" }}>CIRCLE ADDRESS</span>
            <button
              onClick={() => { navigator.clipboard.writeText(newCircle); setCopied(true); setTimeout(() => setCopied(false), 2200); }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, color: T.emeraldBright,
                padding: 0,
              }}
            >
              <Copy size={11} />{copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p style={{ fontFamily: "monospace", fontSize: 12, color: T.ivoryDim, wordBreak: "break-all", lineHeight: 1.7 }}>
            {newCircle}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/app")} style={{
            flex: 1, background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "12px",
            fontSize: 14, fontWeight: 600, color: T.ivoryDim,
            fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
          }}>Home</button>
          <button onClick={() => navigate(`/app/circle/${newCircle}`)} style={{
            flex: 1, background: T.emerald,
            border: "none", borderRadius: 10, padding: "12px",
            fontSize: 14, fontWeight: 700, color: T.ivory,
            fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
          }}>Open Dashboard</button>
        </div>
      </div>
    );
  }

  /* ── Create form ── */
  const inputStyle = (name: string): React.CSSProperties => ({
    width: "100%", boxSizing: "border-box", borderRadius: 10,
    padding: "12px 16px", fontSize: 14, color: T.ivory,
    background: T.surface2,
    border: `1px solid ${focused === name ? T.borderFocus : T.border}`,
    outline: "none", transition: "border-color 0.15s",
    boxShadow: focused === name ? `0 0 0 3px rgba(15,107,80,0.08)` : "none",
  });

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px 80px" }}>
      <style>{`
        @media (min-width: 480px) {
          .cc-pad { padding: 28px 24px 80px !important; }
        }
        .cc-input { box-sizing: border-box !important; }
        @media (max-width: 380px) {
          .size-grid { grid-template-columns: repeat(5, 1fr) !important; gap: 5px !important; }
          .size-btn  { font-size: 12px !important; padding: 8px 0 !important; }
          .freq-label { font-size: 13px !important; }
        }
      `}</style>

      <h1 style={{
        fontFamily: "Space Grotesk, sans-serif",
        fontSize: 22, fontWeight: 700,
        letterSpacing: "-0.03em", color: T.ivory,
        marginBottom: 4,
      }}>Create a Circle</h1>
      <p style={{ fontSize: 13, color: T.ivorySubtle, marginBottom: 28 }}>
        Set up your savings group in 60 seconds
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Name */}
        <Field label="Circle name" hint="e.g. Lagos Friday Ajo">
          <input
            type="text"
            placeholder="My Savings Circle"
            value={form.name}
            maxLength={64}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle("name")}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
          />
        </Field>

        {/* Contribution */}
        <Field label="Contribution per round" hint="USDC · min $1">
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 16, top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14, fontWeight: 600, color: T.ivorySubtle,
            }}>$</span>
            <input
              type="number" min={1} step={1} placeholder="50"
              value={form.contribution}
              onChange={e => setForm({ ...form, contribution: e.target.value })}
              style={{ ...inputStyle("contrib"), paddingLeft: 32 }}
              onFocus={() => setFocused("contrib")}
              onBlur={() => setFocused(null)}
            />
          </div>
        </Field>

        {/* Group size */}
        <Field label="Group size" hint="3–50 members">
          <div className="size-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 8 }}>
            {QUICK_SIZES.map(n => {
              const sel = form.maxMembers === String(n);
              return (
                <button key={n} className="size-btn"
                  onClick={() => setForm({ ...form, maxMembers: String(n) })}
                  style={{
                    padding: "10px 0", borderRadius: 8,
                    fontSize: 14, fontWeight: 700,
                    fontFamily: "Space Grotesk, sans-serif",
                    cursor: "pointer", transition: "all 0.15s",
                    background: sel ? T.emerald : T.surface2,
                    border: `1px solid ${sel ? T.emerald : T.border}`,
                    color: sel ? T.ivory : T.ivorySubtle,
                  }}
                >{n}</button>
              );
            })}
          </div>
          <input
            type="number" min={3} max={50}
            value={form.maxMembers}
            placeholder="Custom size"
            onChange={e => setForm({ ...form, maxMembers: e.target.value })}
            style={inputStyle("members")}
            onFocus={() => setFocused("members")}
            onBlur={() => setFocused(null)}
          />
        </Field>

        {/* Frequency */}
        <Field label="Rotation frequency">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FREQ_OPTIONS.map(opt => {
              const sel = form.frequency === opt.value;
              return (
                <button key={opt.value}
                  onClick={() => setForm({ ...form, frequency: opt.value })}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 16px", borderRadius: 10,
                    cursor: "pointer", transition: "all 0.15s",
                    background: sel ? "rgba(15,107,80,0.08)" : T.surface2,
                    border: `1px solid ${sel ? "rgba(15,107,80,0.30)" : T.border}`,
                    textAlign: "left",
                  }}
                >
                  <div>
                    <p style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontSize: 14, fontWeight: 600,
                      color: sel ? T.emeraldBright : T.ivory,
                      marginBottom: 2,
                    }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: T.ivorySubtle }}>{opt.sub}</p>
                  </div>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: `2px solid ${sel ? T.emeraldBright : "rgba(245,242,234,0.20)"}`,
                    background: sel ? T.emeraldBright : "transparent",
                    flexShrink: 0, transition: "all 0.15s",
                  }} />
                </button>
              );
            })}
          </div>
        </Field>

        {/* Summary */}
        <div style={{
          background: T.surface1,
          border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Info size={13} color={T.emeraldBright} />
            <span style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 13, fontWeight: 600, color: T.emeraldBright,
            }}>Circle Summary</span>
          </div>
          <div style={{ height: 1, background: T.border, marginBottom: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <SummaryRow label="Each member contributes" value={`$${form.contribution} USDC`} />
            <SummaryRow label="Max group size"          value={`${form.maxMembers} people`} />
            <SummaryRow label="Pot per rotation"        value={`$${potTotal.toFixed(0)} USDC`} accent />
            <SummaryRow label="Rotation every"          value={FREQ_OPTIONS[form.frequency].label} />
            <SummaryRow label="Yield on idle funds"     value="Aave v3 (~3% APY)" />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!valid || busy}
          style={{
            width: "100%", height: 52,
            background: valid && !busy ? T.emerald : "rgba(245,242,234,0.06)",
            color: valid && !busy ? T.ivory : T.ivorySubtle,
            border: "none", borderRadius: 10,
            fontSize: 16, fontWeight: 700,
            fontFamily: "Space Grotesk, sans-serif",
            cursor: valid && !busy ? "pointer" : "default",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {busy && <Loader2 size={18} className="animate-spin" />}
          {isPending ? "Waiting for wallet…" : isConfirming ? "Confirming…" : "Create Circle"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: T.ivorySubtle }}>
          Transaction requires approval in your wallet
        </p>
      </div>
    </div>
  );
}
