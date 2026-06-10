import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, User, Compass } from "lucide-react";
import { useAccount } from "wagmi";
import WalletButton from "./WalletButton";
import { Logo, EmblemIcon, WordmarkSVG } from "./Logo";
import CinematicBackground from "./CinematicBackground";

/* ─── design tokens ──────────────────────────────────────── */
const T = {
  obsidian:  "#111111",
  surface1:  "#181818",
  ivory:     "#F5F2EA",
  ivoryDim:  "#A8A49C",
  ivorySubtle:"#6B6760",
  emerald:   "#0F6B50",
  emeraldBright:"#17A77A",
  gold:      "#C88B3A",
  border:    "rgba(245,242,234,0.07)",
  borderMid: "rgba(245,242,234,0.11)",
} as const;

const NAV = [
  { to: "/app",         icon: LayoutDashboard, label: "Home"    },
  { to: "/app/explore", icon: Compass,         label: "My Circles" },
  { to: "/app/create",  icon: PlusCircle,      label: "Create"  },
  { to: "/app/profile", icon: User,            label: "Profile" },
];

export default function Layout() {
  const { isConnected } = useAccount();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = NAV.find(n => n.to === location.pathname)?.label ?? "Dashboard";

  return (
    <div style={{ minHeight: "100dvh", display: "flex", position: "relative" }}>
      <CinematicBackground />

      {/* ── Subtle dot grid ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(245,242,234,0.035) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* ════ SIDEBAR ════════════════════════════════ */}
      <aside style={{
        display: "none",
        position: "fixed", top: 0, left: 0, bottom: 0, width: 220,
        zIndex: 40, flexDirection: "column",
        background: T.surface1,
        borderRight: `1px solid ${T.border}`,
      }} className="lg-sidebar">

        {/* Logo — click goes to landing page */}
        <div style={{ padding: "20px 16px 18px" }}>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <Logo iconSize={26} textHeight={19} gap={8} iconColor={T.emeraldBright} />
          </div>
        </div>

        <div style={{ height: 1, background: T.border, margin: "0 16px 12px" }} />

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/app"} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 9,
                  cursor: "pointer", transition: "all 0.15s",
                  background: isActive ? "rgba(15,107,80,0.12)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(15,107,80,0.25)" : "transparent"}`,
                  color: isActive ? T.emeraldBright : T.ivorySubtle,
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  fontFamily: "Space Grotesk, sans-serif",
                  letterSpacing: isActive ? "-0.01em" : "0",
                }}>
                  <Icon size={16} color={isActive ? T.emeraldBright : T.ivorySubtle} />
                  {label}
                  {isActive && (
                    <div style={{
                      marginLeft: "auto", width: 5, height: 5,
                      borderRadius: "50%", background: T.emeraldBright,
                    }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: network + wallet */}
        <div style={{
          padding: "16px",
          borderTop: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: T.emeraldBright, flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: T.ivorySubtle }}>Arbitrum Sepolia</span>
          </div>
          <WalletButton sidebar />
        </div>
      </aside>

      {/* ════ MAIN CONTENT ═══════════════════════════ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 1,
      }} className="main-content-area">

        {/* Mobile top bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px", height: 56,
          background: "rgba(17,17,17,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${T.border}`,
        }} className="mobile-topbar">
          <div onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <Logo iconSize={26} textHeight={18} gap={7} iconColor={T.emeraldBright} />
          </div>
          <WalletButton />
        </header>

        {/* Desktop top bar */}
        <header style={{
          display: "none",
          alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", height: 60,
          borderBottom: `1px solid ${T.border}`,
          background: T.surface1,
        }} className="desktop-topbar">
          <p style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 14, fontWeight: 600,
            letterSpacing: "-0.01em",
            color: T.ivoryDim,
          }}>{currentPage}</p>
          <WalletButton />
        </header>

        {/* Page outlet */}
        <main style={{ flex: 1, paddingBottom: 72 }} className="main-outlet">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 40, display: "flex", justifyContent: "space-around",
          padding: "8px 4px 10px",
          background: "rgba(24,24,24,0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: `1px solid ${T.border}`,
        }} className="mobile-bottom-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/app"} style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3,
                  padding: "6px 16px",
                  color: isActive ? T.emeraldBright : T.ivorySubtle,
                  fontSize: 10, fontWeight: isActive ? 600 : 400,
                  fontFamily: "Space Grotesk, sans-serif",
                  transition: "color 0.15s",
                }}>
                  <Icon size={19} />
                  {label}
                  {isActive && (
                    <div style={{
                      width: 3, height: 3, borderRadius: "50%",
                      background: T.emeraldBright, marginTop: 1,
                    }} />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar        { display: flex !important; }
          .main-content-area { margin-left: 220px; }
          .mobile-topbar     { display: none !important; }
          .desktop-topbar    { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
          .main-outlet       { padding-bottom: 0 !important; }
        }
      `}</style>
    </div>
  );
}
