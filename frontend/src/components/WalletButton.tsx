import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { useState } from "react";
import { Wallet, ChevronDown, LogOut, AlertTriangle } from "lucide-react";

const T = {
  obsidian:    "#111111",
  surface1:    "#181818",
  ivory:       "#F5F2EA",
  ivoryDim:    "#A8A49C",
  ivorySubtle: "#6B6760",
  emerald:     "#0F6B50",
  emeraldBright:"#17A77A",
  gold:        "#C88B3A",
  border:      "rgba(245,242,234,0.08)",
} as const;

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const dropStyle: React.CSSProperties = {
  background: "#181818",
  border: "1px solid rgba(245,242,234,0.10)",
  borderRadius: 12,
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  padding: "6px",
  position: "absolute", zIndex: 50,
};

export default function WalletButton({ sidebar = false }: { sidebar?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors }  = useConnect();
  const { disconnect }            = useDisconnect();
  const chainId                  = useChainId();
  const { switchChain }          = useSwitchChain();
  const [open, setOpen]          = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  const isWrongNetwork = isConnected && chainId !== arbitrumSepolia.id && chainId !== 42161;

  /* ── Not connected ── */
  if (!isConnected) {
    const btn = (
      <button
        onClick={() => setShowConnect(!showConnect)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 7,
          background: T.emerald, color: T.ivory, border: "none",
          borderRadius: 8, padding: sidebar ? "10px 16px" : "8px 16px",
          fontSize: 13, fontWeight: 700,
          fontFamily: "Space Grotesk, sans-serif",
          cursor: "pointer", transition: "background 0.2s",
          width: sidebar ? "100%" : "auto",
        }}
        onMouseOver={e => (e.currentTarget.style.background = T.emeraldBright)}
        onMouseOut={e => (e.currentTarget.style.background = T.emerald)}
      >
        <Wallet size={14} /> {sidebar ? "Connect Wallet" : "Connect"}
      </button>
    );

    const dropdown = showConnect && (
      <div style={{
        ...dropStyle,
        ...(sidebar ? { bottom: "100%", left: 0, right: 0, marginBottom: 6 }
                    : { top: "calc(100% + 6px)", right: 0, minWidth: 200 }),
      }}>
        <p style={{ fontSize: 10, color: T.ivorySubtle, padding: "4px 10px 6px", letterSpacing: "0.08em" }}>
          CHOOSE WALLET
        </p>
        {connectors.map(c => (
          <button
            key={c.uid}
            onClick={() => { connect({ connector: c }); setShowConnect(false); }}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "10px 12px", borderRadius: 8,
              fontSize: 13, fontWeight: 500, color: T.ivory,
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "Space Grotesk, sans-serif",
              transition: "background 0.15s",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(245,242,234,0.05)")}
            onMouseOut={e => (e.currentTarget.style.background = "none")}
          >{c.name}</button>
        ))}
      </div>
    );

    return (
      <div style={{ position: "relative" }}>
        {btn}
        {dropdown}
      </div>
    );
  }

  /* ── Wrong network ── */
  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: arbitrumSepolia.id })}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 8, padding: sidebar ? "10px 16px" : "8px 14px",
          fontSize: 12, fontWeight: 700, color: "#EF4444",
          fontFamily: "Space Grotesk, sans-serif", cursor: "pointer",
          width: sidebar ? "100%" : "auto", justifyContent: sidebar ? "center" : "flex-start",
        }}
      >
        <AlertTriangle size={12} /> Wrong Network
      </button>
    );
  }

  /* ── Connected ── */
  if (sidebar) {
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "10px 12px", borderRadius: 10,
            background: "rgba(15,107,80,0.08)",
            border: "1px solid rgba(15,107,80,0.22)",
            cursor: "pointer", transition: "all 0.15s",
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            background: T.emerald, opacity: 0.9,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.ivory }}>
              {address!.slice(2, 4).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 13, fontWeight: 600, color: T.ivory,
            flex: 1, textAlign: "left",
          }}>{shortAddr(address!)}</span>
          <ChevronDown size={12} color={T.ivorySubtle} />
        </button>
        {open && (
          <div style={{ ...dropStyle, bottom: "100%", left: 0, right: 0, marginBottom: 6 }}>
            <p style={{
              fontFamily: "monospace", fontSize: 10,
              color: T.ivorySubtle, padding: "6px 10px 8px",
              wordBreak: "break-all", lineHeight: 1.5,
            }}>{address}</p>
            <div style={{ height: 1, background: T.border, marginBottom: 4 }} />
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "9px 10px", borderRadius: 7,
                fontSize: 13, fontWeight: 500, color: "#EF4444",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "Space Grotesk, sans-serif",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
              onMouseOut={e => (e.currentTarget.style.background = "none")}
            >
              <LogOut size={13} /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(15,107,80,0.08)",
          border: "1px solid rgba(15,107,80,0.22)",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: T.emerald, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: T.ivory }}>
            {address!.slice(2, 4).toUpperCase()}
          </span>
        </div>
        <span style={{
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: 13, fontWeight: 600, color: T.ivory,
        }}>{shortAddr(address!)}</span>
        <ChevronDown size={12} color={T.ivorySubtle} />
      </button>
      {open && (
        <div style={{ ...dropStyle, top: "calc(100% + 6px)", right: 0, minWidth: 160 }}>
          <button
            onClick={() => { disconnect(); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 10px", borderRadius: 7,
              fontSize: 13, fontWeight: 500, color: "#EF4444",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "Space Grotesk, sans-serif",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseOut={e => (e.currentTarget.style.background = "none")}
          >
            <LogOut size={13} /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
