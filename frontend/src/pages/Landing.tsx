import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import LivingCircle, { DEMO_MEMBERS } from "../components/LivingCircle";
import { Logo } from "../components/Logo";
import CinematicBackground from "../components/CinematicBackground";

/* ─── colour tokens ──────────────────────────────────────── */
const T = {
  obsidian:     "#111111",
  ivory:        "#F5F2EA",
  ivoryDim:     "#A8A49C",
  ivorySubtle:  "#6B6760",
  ivoryGhost:   "#3A3733",
  emerald:      "#0F6B50",
  emeraldBright:"#17A77A",
  gold:         "#C88B3A",
  goldBright:   "#E8A84A",
  slate:        "#46505A",
  surface1:     "#181818",
  surface2:     "#202020",
} as const;

/* ─── intersection observer hook ─────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const container: React.CSSProperties = { maxWidth: 1080, margin: "0 auto" };

/* ─── small sub-components ───────────────────────────────── */
function Eyebrow({ children, color = T.emeraldBright }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{
      fontFamily: "Space Grotesk, sans-serif",
      fontSize: 11, fontWeight: 700,
      color, letterSpacing: "0.14em",
      marginBottom: 16,
    }}>{children}</p>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    }}>{children}</div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative", color: T.ivory, overflowX: "hidden" }}>
      <CinematicBackground />

      <div style={{ position: "relative", zIndex: 1 }}>

      <style>{`
        @keyframes guardian-orbit   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes center-breathe   { 0%,100% { opacity:0.88; r:8; } 50% { opacity:1; r:10; } }
        @keyframes log-pulse        { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes fade-in-up       { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes flow-down        { 0% { opacity:0; transform:scaleY(0); } 100% { opacity:1; transform:scaleY(1); } }

        @media (max-width: 768px) {
          .hero-headline  { font-size: 52px !important; }
          .two-col        { flex-direction: column !important; }
          .hero-circle    { max-width: 320px !important; margin: 0 auto !important; }
          .stats-row      { gap: 24px !important; }
          .proof-grid     { grid-template-columns: 1fr !important; }
          .tech-grid      { grid-template-columns: 1fr 1fr !important; }
          .footer-inner   { flex-direction: column !important; gap: 28px !important; text-align: center; }
          .tradition-grid { grid-template-columns: 1fr 1fr !important; }
          .flow-row       { flex-direction: column !important; align-items: flex-start !important; }
        }
        @media (max-width: 480px) {
          .hero-headline  { font-size: 42px !important; }
          .cta-headline   { font-size: 44px !important; }
          .tech-grid      { grid-template-columns: 1fr !important; }
          .stats-row      { flex-direction: column !important; gap: 20px !important; }
          .tradition-grid { grid-template-columns: 1fr !important; }
        }
        .nav-glass {
          background: rgba(17,17,17,0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(245,242,234,0.07);
        }
        .btn-primary:hover  { background: #17A77A !important; transform: translateY(-1px); }
        .btn-primary:active { transform: scale(0.97) !important; }
        .btn-ghost:hover    { border-color: rgba(245,242,234,0.35) !important; color: #F5F2EA !important; }
        .nav-link:hover     { color: #F5F2EA !important; }
        .footer-link:hover  { color: #A8A49C !important; }
        .tradition-card:hover { border-color: rgba(200,139,58,0.25) !important; transform: translateY(-2px); }
      `}</style>

      {/* ════ NAV ════════════════════════════════════ */}
      <nav className="nav-glass" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 64,
      }}>
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        >
          <Logo iconSize={30} textHeight={22} gap={9} iconColor="#17A77A" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="#tradition" className="nav-link" style={{
            fontSize: 14, color: T.ivorySubtle, textDecoration: "none",
            fontWeight: 500, padding: "0 12px", transition: "color 0.15s",
          }}>The tradition</a>
          <a href="#how" className="nav-link" style={{
            fontSize: 14, color: T.ivorySubtle, textDecoration: "none",
            fontWeight: 500, padding: "0 12px", transition: "color 0.15s",
          }}>How it works</a>
          <button onClick={() => navigate("/app")} className="btn-primary" style={{
            background: T.emerald, color: T.ivory, border: "none",
            borderRadius: 8, padding: "9px 20px",
            fontSize: 14, fontWeight: 600,
            fontFamily: "Space Grotesk, sans-serif",
            cursor: "pointer", transition: "all 0.2s",
          }}>Launch App</button>
        </div>
      </nav>

      {/* ════ HERO ═══════════════════════════════════ */}
      <section style={{
        minHeight: "100vh",
        display: "flex", alignItems: "center",
        padding: "100px 28px 80px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 20% 55%, rgba(15,107,80,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 30%, rgba(200,139,58,0.05) 0%, transparent 65%)
          `,
        }} />
        <div style={{ ...container, zIndex: 1, width: "100%", display: "flex", alignItems: "center", gap: 72 }}
          className="two-col">

          {/* ── Text ── */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(15,107,80,0.10)", border: "1px solid rgba(15,107,80,0.28)",
              borderRadius: 20, padding: "6px 14px", marginBottom: 36,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.emeraldBright, flexShrink: 0,
                animation: "log-pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: T.emeraldBright, letterSpacing: "0.08em" }}>
                LIVE ON ARBITRUM SEPOLIA
              </span>
            </div>

            <h1 className="hero-headline" style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 80, fontWeight: 700,
              letterSpacing: "-0.045em", lineHeight: 1.0,
              color: T.ivory, marginBottom: 28,
            }}>
              WEALTH<br />
              MOVES IN<br />
              <span style={{ color: T.gold }}>CIRCLES.</span>
            </h1>

            <p style={{
              fontSize: 18, color: T.ivoryDim,
              lineHeight: 1.7, maxWidth: 420,
              marginBottom: 44, fontWeight: 400,
            }}>
              Community savings circles are one of humanity's oldest financial systems.
              ArbiCycle doesn't replace them.<br />
              <span style={{ color: T.ivory, fontWeight: 500 }}>It protects them.</span>
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => navigate("/app")} className="btn-primary" style={{
                background: T.emerald, color: T.ivory, border: "none",
                borderRadius: 10, padding: "15px 32px",
                fontSize: 16, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                cursor: "pointer", transition: "all 0.2s",
                letterSpacing: "-0.01em",
              }}>Start Saving →</button>
              <a href="#tradition" className="btn-ghost" style={{
                background: "transparent", color: T.ivoryDim,
                border: "1px solid rgba(245,242,234,0.16)",
                borderRadius: 10, padding: "15px 32px",
                fontSize: 16, fontWeight: 500,
                fontFamily: "Space Grotesk, sans-serif",
                cursor: "pointer", transition: "all 0.2s",
                textDecoration: "none", display: "inline-block",
              }}>The tradition</a>
            </div>

            {/* Stats */}
            <div className="stats-row" style={{
              marginTop: 52,
              paddingTop: 28,
              borderTop: "1px solid rgba(245,242,234,0.07)",
              display: "flex", gap: 40, flexWrap: "wrap",
            }}>
              {[
                { val: "2B+",  label: "People save in circles worldwide" },
                { val: "Zero", label: "Trusted coordinator required" },
                { val: "100%", label: "On-chain transparent" },
              ].map(({ val, label }) => (
                <div key={val}>
                  <p style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: 30, fontWeight: 700,
                    letterSpacing: "-0.035em",
                    color: T.ivory, lineHeight: 1, marginBottom: 5,
                  }}>{val}</p>
                  <p style={{ fontSize: 12, color: T.ivorySubtle, lineHeight: 1.4 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Circle — larger, more central ── */}
          <div className="hero-circle" style={{ flex: "0 1 500px", maxWidth: 500 }}>
            <LivingCircle
              members={DEMO_MEMBERS}
              potValue="$1,200"
              size={500}
              showGuardian={true}
              animate={true}
              round={3}
            />
          </div>
        </div>
      </section>

      {/* ════ OPERATIONAL STATS BAR ══════════════════ */}
      <div style={{
        background: T.surface1,
        borderTop: "1px solid rgba(245,242,234,0.06)",
        borderBottom: "1px solid rgba(245,242,234,0.06)",
        padding: "16px 28px",
        display: "flex", justifyContent: "center", overflow: "hidden",
      }}>
        <div style={{
          maxWidth: 1000, width: "100%",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          gap: 24, flexWrap: "wrap",
        }}>
          {[
            { val: "Arbitrum",           desc: "Settlement layer" },
            { val: "Chainlink VRF",      desc: "Provable fairness" },
            { val: "Chainlink Automation", desc: "Self-executing rounds" },
            { val: "Aave v3",            desc: "Idle yield" },
            { val: "USDC",               desc: "Stable contributions" },
          ].map(({ val, desc }) => (
            <div key={val} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.emerald, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T.ivorySubtle, whiteSpace: "nowrap" }}>
                <span style={{ color: T.ivoryDim, fontWeight: 500 }}>{val}</span>
                {" · "}{desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ════ THE TRADITION ══════════════════════════ */}
      <section id="tradition" style={{ background: "transparent", padding: "120px 28px" }}>
        <div style={container}>
          <Reveal>
            <div style={{ maxWidth: 680, marginBottom: 72 }}>
              <Eyebrow color={T.gold}>A GLOBAL TRADITION</Eyebrow>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 48, fontWeight: 700,
                letterSpacing: "-0.035em", lineHeight: 1.1,
                color: T.ivory, marginBottom: 20,
              }}>
                Savings circles already<br />
                power communities worldwide.
              </h2>
              <p style={{ fontSize: 17, color: T.ivoryDim, lineHeight: 1.75 }}>
                Long before banks, long before apps, communities built wealth together
                through rotating savings circles. Every month, every member contributes.
                Each round, one member receives the full pot. The system repeats until
                everyone has received once. Simple. Powerful. Trusted for generations.
              </p>
            </div>
          </Reveal>

          {/* Tradition cards */}
          <div className="tradition-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 10, marginBottom: 72,
          }}>
            {[
              { name: "Ajo",    region: "Nigeria",          members: "100M+ participants" },
              { name: "Chama",  region: "Kenya",            members: "300K+ active groups" },
              { name: "Esusu",  region: "West Africa",      members: "Centuries old" },
              { name: "Susu",   region: "Caribbean / Ghana", members: "Diaspora network" },
              { name: "Stokvel", region: "South Africa",    members: "$50B+ annually" },
            ].map(({ name, region, members }) => (
              <Reveal key={name}>
                <div className="tradition-card" style={{
                  background: T.surface1,
                  border: "1px solid rgba(245,242,234,0.06)",
                  borderRadius: 14, padding: "24px 20px",
                  transition: "border-color 0.2s, transform 0.2s",
                  cursor: "default",
                }}>
                  <p style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: 22, fontWeight: 700,
                    color: T.gold, letterSpacing: "-0.02em",
                    marginBottom: 6,
                  }}>{name}</p>
                  <p style={{ fontSize: 13, color: T.ivory, fontWeight: 500, marginBottom: 4 }}>{region}</p>
                  <p style={{ fontSize: 12, color: T.ivorySubtle, lineHeight: 1.5 }}>{members}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* The statement */}
          <Reveal>
            <div style={{
              background: "rgba(200,139,58,0.05)",
              border: "1px solid rgba(200,139,58,0.16)",
              borderRadius: 18, padding: "48px 52px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 28, fontWeight: 700,
                letterSpacing: "-0.025em", lineHeight: 1.4,
                color: T.ivory, maxWidth: 600, margin: "0 auto 16px",
              }}>
                ArbiCycle doesn't replace savings circles.
              </p>
              <p style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 28, fontWeight: 700,
                letterSpacing: "-0.025em",
                color: T.gold,
              }}>It protects them.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════ THE PROBLEM ════════════════════════════ */}
      <section style={{ background: "rgba(24,24,24,0.6)", padding: "120px 28px" }}>
        <div style={container}>
          <Reveal>
            <div style={{ maxWidth: 700, marginBottom: 56 }}>
              <Eyebrow>THE VULNERABILITY</Eyebrow>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 44, fontWeight: 700,
                letterSpacing: "-0.035em", lineHeight: 1.1,
                color: T.ivory, marginBottom: 20,
              }}>
                The model works.<br />
                <span style={{ color: T.gold }}>The coordination doesn't.</span>
              </h2>
              <p style={{ fontSize: 17, color: T.ivoryDim, lineHeight: 1.75, marginBottom: 16 }}>
                For generations, communities have used rotating savings circles
                to build wealth together through trust, consistency, and accountability.
              </p>
              <p style={{ fontSize: 17, color: T.ivoryDim, lineHeight: 1.75 }}>
                One human coordinator can disappear, delay payouts, play favourites,
                or lose track entirely. ArbiCycle automates the coordination layer —
                protecting the trust that already exists.
              </p>
            </div>
          </Reveal>

          <div className="proof-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
          }}>
            {[
              { stat: "40%",   label: "of informal savings groups experience coordinator fraud or mismanagement", col: T.gold },
              { stat: "∞",     label: "Disputes over rotation order — who goes first, who goes last, who decided",  col: T.ivoryDim },
              { stat: "$0",    label: "Yield on idle contributions sitting in a coordinator's personal account",    col: T.ivoryDim },
            ].map(({ stat, label, col }) => (
              <Reveal key={stat}>
                <div style={{
                  background: T.surface2,
                  border: "1px solid rgba(245,242,234,0.06)",
                  borderRadius: 16, padding: "40px 32px",
                  height: "100%",
                }}>
                  <p style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: 64, fontWeight: 700,
                    letterSpacing: "-0.04em",
                    color: col, lineHeight: 1, marginBottom: 16,
                  }}>{stat}</p>
                  <p style={{ fontSize: 14, color: T.ivorySubtle, lineHeight: 1.65 }}>{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════ WHY NOW ════════════════════════════════ */}
      <section style={{ background: "transparent", padding: "120px 28px" }}>
        <div style={container}>
          <Reveal>
            <div style={{ maxWidth: 640, marginBottom: 64 }}>
              <Eyebrow color={T.gold}>WHY NOW</Eyebrow>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 44, fontWeight: 700,
                letterSpacing: "-0.035em", lineHeight: 1.1,
                color: T.ivory, marginBottom: 20,
              }}>
                The infrastructure<br />
                finally exists.
              </h2>
              <p style={{ fontSize: 17, color: T.ivoryDim, lineHeight: 1.75 }}>
                For the first time in history, we have all the pieces needed
                to make community savings circles completely trustless.
                This wasn't possible five years ago. It is now.
              </p>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {[
              {
                icon: "💵",
                title: "Stable digital money",
                body: "USDC brings dollar stability to digital payments. No speculation. Contributions mean exactly what they say.",
              },
              {
                icon: "⚡",
                title: "Near-zero settlement cost",
                body: "Arbitrum makes sub-cent transactions a reality. A circle member in Lagos pays the same fee as one in London.",
              },
              {
                icon: "🎲",
                title: "Verifiable fairness",
                body: "Chainlink VRF produces randomness that anyone can verify on-chain. No coordinator can rig the rotation order.",
              },
              {
                icon: "🤖",
                title: "Autonomous coordination",
                body: "Chainlink Automation runs circles without a server, a cron job, or a human. The protocol enforces its own rules.",
              },
            ].map(({ icon, title, body }) => (
              <Reveal key={title}>
                <div style={{
                  background: T.surface1,
                  border: "1px solid rgba(245,242,234,0.06)",
                  borderRadius: 16, padding: "32px 28px",
                }}>
                  <span style={{ fontSize: 28, display: "block", marginBottom: 16 }}>{icon}</span>
                  <p style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: 16, fontWeight: 700,
                    color: T.ivory, marginBottom: 10,
                    letterSpacing: "-0.02em",
                  }}>{title}</p>
                  <p style={{ fontSize: 14, color: T.ivorySubtle, lineHeight: 1.7 }}>{body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <div style={{ marginTop: 56, textAlign: "center" }}>
              <p style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 22, fontWeight: 600,
                color: T.ivoryDim, letterSpacing: "-0.015em",
                lineHeight: 1.6, maxWidth: 560, margin: "0 auto",
              }}>
                ArbiCycle is the natural evolution<br />
                of a system that already works.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════ THE LIVING CIRCLE ══════════════════════ */}
      <section style={{ background: "rgba(24,24,24,0.6)", padding: "120px 28px" }}>
        <div style={container}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <Eyebrow color={T.gold}>THE LIVING CIRCLE</Eyebrow>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 44, fontWeight: 700,
                letterSpacing: "-0.035em", color: T.ivory,
                marginBottom: 16,
              }}>One glance. Full picture.</h2>
              <p style={{ fontSize: 16, color: T.ivoryDim, maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
                The circle communicates everything — who paid, who hasn't, who receives next,
                how much is in the pot, circle health. No legends. No confusion.
              </p>
            </div>
          </Reveal>

          <div className="two-col" style={{
            display: "flex", alignItems: "center",
            gap: 80, justifyContent: "center",
          }}>
            {/* Larger circle */}
            <div className="hero-circle" style={{ flex: "0 0 420px", maxWidth: 420 }}>
              <LivingCircle
                members={DEMO_MEMBERS}
                potValue="$1,200"
                size={420}
                showGuardian={true}
                animate={true}
                round={3}
              />
            </div>

            <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 24 }}>
              {[
                { color: T.emeraldBright, label: "Received payout",    desc: "Members who already received their rotation. Their cycle is complete." },
                { color: T.gold,          label: "Current recipient",  desc: "Who receives the full pot this round — selected by Chainlink VRF at creation." },
                { color: T.emerald,       label: "Contributed",        desc: "Members who sent their contribution for the current round." },
                { color: T.slate,         label: "Pending",            desc: "Members yet to contribute. The Guardian tracks and enforces automatically." },
              ].map(({ color, label, desc }) => (
                <div key={label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 14, fontWeight: 600, color: T.ivory, marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 13, color: T.ivorySubtle, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════ HOW IT WORKS ═══════════════════════════ */}
      <section id="how" style={{ background: "transparent", padding: "120px 28px" }}>
        <div style={container}>
          <Reveal>
            <Eyebrow>HOW IT WORKS</Eyebrow>
            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 44, fontWeight: 700,
              letterSpacing: "-0.035em",
              color: T.ivory, marginBottom: 56,
            }}>Three steps. Zero trust required.</h2>
          </Reveal>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              {
                n: "01", color: T.emerald, tag: "Smart Contract",
                title: "Create or join a circle",
                body: "Set contribution amount, group size, and rotation frequency. Share an invite link. The smart contract becomes the permanent coordinator — no human needed, ever.",
              },
              {
                n: "02", color: T.gold, tag: "Chainlink VRF",
                title: "Rotation order locked by mathematics",
                body: "Chainlink VRF generates tamper-proof randomness on-chain the moment the circle is full. Nobody — not the creator, not ArbiCycle — can predict or influence who goes when.",
              },
              {
                n: "03", color: T.emeraldBright, tag: "Guardian · Autonomous",
                title: "The Guardian handles everything else",
                body: "Each round, members contribute. The Guardian collects, distributes the pot, earns yield on idle funds via Aave v3, and triggers rotation automatically at deadline. Zero manual steps.",
              },
            ].map(({ n, color, tag, title, body }) => (
              <Reveal key={n}>
                <div style={{
                  background: T.surface1,
                  border: "1px solid rgba(245,242,234,0.06)",
                  borderRadius: 14,
                  padding: "36px 40px",
                  display: "flex", gap: 28, alignItems: "flex-start",
                }}>
                  <div style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: 13, fontWeight: 700,
                    color, letterSpacing: "0.04em",
                    opacity: 0.6, flexShrink: 0, marginTop: 2,
                  }}>{n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <h3 style={{
                        fontFamily: "Space Grotesk, sans-serif",
                        fontSize: 19, fontWeight: 700,
                        letterSpacing: "-0.025em", color: T.ivory,
                      }}>{title}</h3>
                      <span style={{
                        fontSize: 10, fontWeight: 600, letterSpacing: "0.10em",
                        color, background: `${color}12`, border: `1px solid ${color}30`,
                        borderRadius: 4, padding: "3px 8px",
                      }}>{tag}</span>
                    </div>
                    <p style={{ fontSize: 15, color: T.ivoryDim, lineHeight: 1.75 }}>{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════ VRF CEREMONY ═══════════════════════════ */}
      <section style={{ background: "rgba(24,24,24,0.6)", padding: "120px 28px" }}>
        <div style={{ ...container, textAlign: "center" }}>
          <Reveal>
            <Eyebrow color={T.gold}>VERIFIABLE FAIRNESS</Eyebrow>
            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 44, fontWeight: 700,
              letterSpacing: "-0.035em", lineHeight: 1.1,
              color: T.ivory, maxWidth: 580,
              margin: "0 auto 16px",
            }}>
              The order is decided by<br />
              <span style={{ color: T.gold }}>mathematics, not favouritism.</span>
            </h2>
            <p style={{
              fontSize: 16, color: T.ivoryDim,
              maxWidth: 440, margin: "0 auto 64px",
              lineHeight: 1.75,
            }}>
              When a circle becomes full, a ceremony happens on-chain.
              It cannot be manipulated. It cannot be repeated. It is permanent.
            </p>
          </Reveal>

          {/* VRF ceremony flow */}
          <Reveal delay={80}>
            <VRFCeremony />
          </Reveal>

          <Reveal delay={160}>
            <div style={{ marginTop: 64 }}>
              <VRFVisual />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════ CIRCLE GUARDIAN ════════════════════════ */}
      <section style={{ background: "transparent", padding: "120px 28px" }}>
        <div style={container}>
          <div className="two-col" style={{ display: "flex", gap: 80, alignItems: "center" }}>
            <div style={{ flex: "0 0 300px", maxWidth: 300 }}>
              <GuardianActivityLog />
            </div>
            <div style={{ flex: "1 1 360px" }}>
              <Reveal>
                <Eyebrow color={T.gold}>CIRCLE GUARDIAN</Eyebrow>
                <h2 style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 40, fontWeight: 700,
                  letterSpacing: "-0.035em", lineHeight: 1.12,
                  color: T.ivory, marginBottom: 16,
                }}>
                  Autonomous coordination<br />
                  <span style={{ color: T.gold }}>infrastructure.</span>
                </h2>
                <p style={{ fontSize: 16, color: T.ivoryDim, lineHeight: 1.75, marginBottom: 28 }}>
                  The Guardian is not a bot or a mascot. It is the enforcement layer —
                  a set of smart contract rules powered by Chainlink Automation
                  that runs continuously, applies consequences automatically,
                  and answers to nobody.
                </p>
                <p style={{ fontSize: 15, color: T.ivorySubtle, lineHeight: 1.75, marginBottom: 32, fontStyle: "italic" }}>
                  Think of it as a financial operator that cannot be bribed, cannot be distracted,
                  and never goes offline.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { action: "Triggers rotation precisely at deadline",               state: "Enforced" },
                    { action: "Distributes the full pot to the verified recipient",    state: "On-chain" },
                    { action: "Earns Aave v3 yield on idle contributions",             state: "Active" },
                    { action: "Applies on-chain penalties for missed contributions",   state: "Automatic" },
                    { action: "Updates reputation score after every event",            state: "Permanent" },
                  ].map(({ action, state }) => (
                    <div key={action} style={{
                      display: "flex", gap: 12, alignItems: "center",
                      justifyContent: "space-between",
                      background: T.surface1,
                      border: "1px solid rgba(245,242,234,0.05)",
                      borderRadius: 9, padding: "12px 16px",
                    }}>
                      <span style={{ fontSize: 13, color: T.ivoryDim, lineHeight: 1.5 }}>{action}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                        color: T.emeraldBright, flexShrink: 0,
                        fontFamily: "Space Grotesk, sans-serif",
                      }}>{state}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════ WHAT HAPPENS WHEN SOMEONE MISSES ═══════ */}
      <section style={{ background: "rgba(24,24,24,0.6)", padding: "120px 28px" }}>
        <div style={container}>
          <Reveal>
            <div style={{ maxWidth: 640, marginBottom: 64 }}>
              <Eyebrow>DESIGNED FOR IMPERFECT PARTICIPATION</Eyebrow>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 44, fontWeight: 700,
                letterSpacing: "-0.035em", lineHeight: 1.1,
                color: T.ivory, marginBottom: 20,
              }}>
                What happens when<br />
                someone misses a payment?
              </h2>
              <p style={{ fontSize: 17, color: T.ivoryDim, lineHeight: 1.75 }}>
                Life happens. People are late. ArbiCycle was built with this reality in mind.
                The Guardian doesn't panic — it applies a structured, transparent response
                that protects the circle without requiring any human to intervene.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <DefaultFlow />
          </Reveal>

          {/* Recovery cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10, marginTop: 48 }}>
            {[
              {
                icon: "⏳",
                title: "Late contribution",
                body: "A 2% penalty is applied and directed to the group pot. Trust score updated. Circle continues uninterrupted.",
              },
              {
                icon: "❌",
                title: "Two consecutive misses",
                body: "Member is automatically removed. Their deposit is seized and redistributed to the group pot. No vote required.",
              },
              {
                icon: "🔄",
                title: "Circle continuity",
                body: "Removed members are skipped in all future rotations. The circle continues exactly as designed — no stuck states.",
              },
              {
                icon: "📊",
                title: "Trust score recovery",
                body: "Members can rebuild their reputation over time in future circles. Consistent behaviour is rewarded with better access.",
              },
            ].map(({ icon, title, body }) => (
              <Reveal key={title}>
                <div style={{
                  background: T.surface2,
                  border: "1px solid rgba(245,242,234,0.06)",
                  borderRadius: 14, padding: "28px 24px",
                }}>
                  <span style={{ fontSize: 24, display: "block", marginBottom: 14 }}>{icon}</span>
                  <p style={{
                    fontFamily: "Space Grotesk, sans-serif",
                    fontSize: 15, fontWeight: 700,
                    color: T.ivory, marginBottom: 8, letterSpacing: "-0.01em",
                  }}>{title}</p>
                  <p style={{ fontSize: 13, color: T.ivorySubtle, lineHeight: 1.7 }}>{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════ TECHNOLOGY — SPLIT ═════════════════════ */}
      <section style={{ background: "transparent", padding: "100px 28px" }}>
        <div style={container}>
          <Reveal>
            <Eyebrow>INFRASTRUCTURE</Eyebrow>
            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 36, fontWeight: 700,
              letterSpacing: "-0.03em", color: T.ivory,
              marginBottom: 56,
            }}>Built on infrastructure that earns trust.</h2>
          </Reveal>

          {/* TRUST INFRASTRUCTURE */}
          <Reveal>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 11, fontWeight: 700,
              color: T.gold, letterSpacing: "0.12em",
              marginBottom: 14,
            }}>TRUST INFRASTRUCTURE</p>
          </Reveal>
          <div className="tech-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 32 }}>
            <TechChip label="CHAINLINK VRF" color={T.gold}
              sub="Verifiable Random Function produces tamper-proof randomness for rotation order. The cryptographic proof lives on-chain, auditable forever." />
            <TechChip label="CHAINLINK AUTOMATION" color={T.gold}
              sub="Decentralized keepers monitor circle deadlines and trigger rotations automatically. No server. No cron job. No human operator needed." />
            <TechChip label="USDC · STABLE" color={T.gold}
              sub="All contributions and payouts are in USDC. Price stability keeps everyone focused on community savings, not market speculation." />
          </div>

          {/* EFFICIENCY INFRASTRUCTURE */}
          <Reveal>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 11, fontWeight: 700,
              color: T.emeraldBright, letterSpacing: "0.12em",
              marginBottom: 14,
            }}>EFFICIENCY INFRASTRUCTURE</p>
          </Reveal>
          <div className="tech-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <TechChip label="ARBITRUM" color={T.emerald}
              sub="L2 rollup gives sub-cent transactions with Ethereum security. The fee structure makes micro-contributions viable for the first time." />
            <TechChip label="AAVE V3" color={T.emerald}
              sub="Idle USDC in the pot earns real yield via Aave while waiting for distribution. Your community savings work even while they wait." />
            <TechChip label="EIP-1167 CLONES" color={T.emerald}
              sub="Each circle is a gas-efficient proxy clone. Creating a new savings circle costs less than a cent on Arbitrum — affordable for anyone." />
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ══════════════════════════════ */}
      <section style={{
        background: "rgba(24,24,24,0.6)", padding: "140px 28px",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(15,107,80,0.07) 0%, transparent 70%)",
        }} />
        <div style={{ ...container, position: "relative", zIndex: 1 }}>
          <Reveal>
            <Eyebrow color={T.gold}>THIS ALREADY EXISTS</Eyebrow>
            <h2 className="cta-headline" style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 56, fontWeight: 700,
              letterSpacing: "-0.04em", lineHeight: 1.08,
              color: T.ivory, marginBottom: 20, maxWidth: 640, margin: "0 auto 20px",
            }}>
              Community savings circles<br />
              are where finance started.<br />
              <span style={{ color: T.gold }}>ArbiCycle is where they go next.</span>
            </h2>
            <p style={{
              fontSize: 17, color: T.ivoryDim,
              maxWidth: 420, margin: "0 auto 44px",
              lineHeight: 1.75,
            }}>
              The tradition is yours. The infrastructure is ready.
              No coordinator. No fraud. No missing money.
            </p>
            <button
              onClick={() => navigate("/app")}
              style={{
                background: T.emerald, color: T.ivory, border: "none",
                borderRadius: 12, padding: "18px 52px",
                fontSize: 18, fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                cursor: "pointer", letterSpacing: "-0.02em",
                transition: "all 0.2s",
              }}
              onMouseOver={e => {
                (e.currentTarget as HTMLButtonElement).style.background = T.emeraldBright;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseOut={e => {
                (e.currentTarget as HTMLButtonElement).style.background = T.emerald;
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >Start a Circle — Free</button>
            <p style={{ marginTop: 18, fontSize: 13, color: T.ivorySubtle }}>
              Running on Arbitrum Sepolia. No fees during testnet.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════ FOOTER ═════════════════════════════════ */}
      <footer style={{
        background: "transparent",
        borderTop: "1px solid rgba(245,242,234,0.07)",
        padding: "44px 28px",
      }}>
        <div className="footer-inner" style={{
          ...container,
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 24,
        }}>
          <div>
            <Logo iconSize={26} textHeight={19} gap={8} iconColor="#17A77A" />
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { label: "GitHub",   href: "https://github.com/H2SO4620/ArbiCycle" },
              { label: "Factory Contract",    href: "https://sepolia.arbiscan.io/address/0xbbAE2b7b65c9a9cFA350B6498411C8bD0288e2d1" },
              { label: "Reputation Contract", href: "https://sepolia.arbiscan.io/address/0xd4dF8e90e7962D3D057d15b5A0835473e0a048E8" },
              { label: "Arbitrum", href: "https://arbitrum.io" },
              { label: "Chainlink", href: "https://chain.link" },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="footer-link"
                style={{ fontSize: 13, color: T.ivorySubtle, textDecoration: "none", transition: "color 0.15s" }}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 12, color: T.ivorySubtle }}>
              Deployed on Arbitrum Sepolia · Robinhood Chain eligible
            </p>
            <p style={{ fontSize: 12, color: T.ivorySubtle, marginTop: 4 }}>
              Built for Arbitrum Open House · London 2026
            </p>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}

/* ─── Tech Chip ──────────────────────────────────────────── */
function TechChip({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div style={{
      background: "#141414",
      border: `1px solid rgba(245,242,234,0.06)`,
      borderRadius: 14,
      padding: "24px",
    }}>
      <div style={{
        display: "inline-flex",
        background: `${color}14`, border: `1px solid ${color}35`,
        borderRadius: 5, padding: "3px 9px",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
        color, marginBottom: 12,
      }}>{label}</div>
      <p style={{ fontSize: 13, color: T.ivorySubtle, lineHeight: 1.65 }}>{sub}</p>
    </div>
  );
}

/* ─── VRF Ceremony flow ──────────────────────────────────── */
function VRFCeremony() {
  const steps = [
    { icon: "👥", label: "Members Join",          sub: "Circle reaches capacity" },
    { icon: "🌀", label: "Circle Activates",      sub: "Contract locks in all members" },
    { icon: "🎲", label: "Guardian Requests VRF", sub: "Chainlink randomness called on-chain" },
    { icon: "✨", label: "Rotation Revealed",      sub: "Order returned, verified by proof" },
    { icon: "🔒", label: "Order Locked Forever",  sub: "Immutable. Verifiable. Fair." },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 0, flexWrap: "wrap", maxWidth: 800, margin: "0 auto",
    }}>
      {steps.map(({ icon, label, sub }, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ textAlign: "center", padding: "0 16px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: i === 4 ? "rgba(200,139,58,0.12)" : "rgba(245,242,234,0.04)",
              border: `1px solid ${i === 4 ? "rgba(200,139,58,0.30)" : "rgba(245,242,234,0.10)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, margin: "0 auto 10px",
            }}>{icon}</div>
            <p style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 12, fontWeight: 700,
              color: i === 4 ? T.gold : T.ivory,
              marginBottom: 4, whiteSpace: "nowrap",
            }}>{label}</p>
            <p style={{ fontSize: 11, color: T.ivorySubtle, whiteSpace: "nowrap" }}>{sub}</p>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 28, height: 1,
              background: "rgba(245,242,234,0.12)",
              flexShrink: 0,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Guardian Activity Log ──────────────────────────────── */
function GuardianActivityLog() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 2400);
    return () => clearInterval(t);
  }, []);

  const log = [
    { time: "just now",  msg: "Kofi received payout",          ok: true  },
    { time: "2s ago",    msg: "Rotation triggered",             ok: true  },
    { time: "8s ago",    msg: "Amina contributed ₦50,000",      ok: true  },
    { time: "14s ago",   msg: "Sarah missed contribution",      ok: false },
    { time: "15s ago",   msg: "Penalty applied — 2%",           ok: false },
    { time: "16s ago",   msg: "Trust score updated",            ok: true  },
    { time: "1m ago",    msg: "James contributed ₦50,000",      ok: true  },
    { time: "2m ago",    msg: "Yield accrued: $0.42 USDC",      ok: true  },
  ];

  return (
    <div style={{
      background: "#0D0D0D",
      border: "1px solid rgba(245,242,234,0.08)",
      borderRadius: 14,
      overflow: "hidden",
      fontFamily: "monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(245,242,234,0.06)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: T.emeraldBright,
          animation: "log-pulse 1.8s ease-in-out infinite",
        }} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
          color: T.emeraldBright, fontFamily: "Space Grotesk, sans-serif",
        }}>GUARDIAN · LIVE</span>
      </div>

      {/* Log entries */}
      <div style={{ padding: "8px 0" }}>
        {log.map(({ time, msg, ok }, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "7px 16px",
            opacity: i === 0 ? 1 : Math.max(0.22, 1 - i * 0.10),
            animation: i === 0 ? `fade-in-up 0.4s ease` : undefined,
            animationKey: tick,
          }}>
            <span style={{
              fontSize: 9, color: ok ? T.emeraldBright : "#EF4444",
              flexShrink: 0, marginTop: 1,
            }}>{ok ? "✓" : "✗"}</span>
            <span style={{ fontSize: 11, color: T.ivoryDim, flex: 1, lineHeight: 1.5 }}>{msg}</span>
            <span style={{ fontSize: 10, color: T.ivorySubtle, flexShrink: 0 }}>{time}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid rgba(245,242,234,0.04)",
        fontSize: 10, color: T.ivorySubtle,
        fontFamily: "Space Grotesk, sans-serif",
        letterSpacing: "0.06em",
      }}>
        MONITORING 1 CIRCLE · ROUND 3/6
      </div>
    </div>
  );
}

/* ─── Default Flow diagram ───────────────────────────────── */
function DefaultFlow() {
  const steps = [
    { icon: "⚠️",  label: "Contribution Missed",   color: "#EF4444", desc: "Deadline passes with no payment" },
    { icon: "📢",  label: "Guardian Flags Event",  color: T.gold,    desc: "On-chain event emitted immediately" },
    { icon: "💸",  label: "Penalty Applied",        color: T.gold,    desc: "2% penalty directed to group pot" },
    { icon: "📉",  label: "Trust Score Updated",   color: T.ivoryDim, desc: "−80 points recorded on-chain" },
    { icon: "🔄",  label: "Circle Continues",      color: T.emeraldBright, desc: "Rotation proceeds on schedule" },
  ];

  return (
    <div style={{
      background: "#0F0F0F",
      border: "1px solid rgba(245,242,234,0.07)",
      borderRadius: 16, padding: "36px 32px",
      maxWidth: 700, margin: "0 auto",
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map(({ icon, label, color, desc }, i) => (
          <div key={label}>
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "14px 0",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: `${color}12`,
                border: `1px solid ${color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 14, fontWeight: 700,
                  color, marginBottom: 2,
                }}>{label}</p>
                <p style={{ fontSize: 12, color: T.ivorySubtle }}>{desc}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: T.emeraldBright, fontFamily: "Space Grotesk, sans-serif",
              }}>AUTO</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                marginLeft: 20, width: 1, height: 20,
                background: "rgba(245,242,234,0.08)",
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── VRF Visual ─────────────────────────────────────────── */
function VRFVisual() {
  const members = [
    { name: "Amara",   addr: "0x1a7f…55d9", order: 1 },
    { name: "James",   addr: "0x8e1d…77f3", order: 2 },
    { name: "Kofi",    addr: "0x5c8b…12cc", order: 3 },
    { name: "Sarah",   addr: "0x3f4a…c21b", order: 4 },
    { name: "Zuri",    addr: "0xd063…e38a", order: 5 },
    { name: "Michael", addr: "0xb92c…a04e", order: 6 },
  ];

  return (
    <div style={{
      background: "#0D0D0D",
      border: "1px solid rgba(200,139,58,0.14)",
      borderRadius: 18, padding: "36px 32px",
      maxWidth: 640, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <p style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 16, fontWeight: 700, color: T.ivory, marginBottom: 4,
          }}>Rotation Order Generated</p>
          <p style={{ fontSize: 12, color: T.ivorySubtle }}>
            Chainlink VRF · Block #18,442,891 · Arbitrum Sepolia
          </p>
        </div>
        <div style={{
          background: "rgba(15,107,80,0.12)", border: "1px solid rgba(15,107,80,0.28)",
          borderRadius: 7, padding: "6px 12px",
          fontSize: 11, fontWeight: 600,
          color: T.emeraldBright, letterSpacing: "0.08em",
        }}>✓ VERIFIED ON-CHAIN</div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "6px 16px 10px",
        fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
        color: T.ivorySubtle,
        fontFamily: "Space Grotesk, sans-serif",
      }}>
        <span style={{ width: 26, textAlign: "center", flexShrink: 0 }}>#</span>
        <span style={{ flex: 1 }}>MEMBER</span>
        <span style={{ fontSize: 10, color: T.ivorySubtle }}>WALLET</span>
        <span style={{ width: 90, textAlign: "right", flexShrink: 0 }}>RECEIVES POT</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {members.map(({ name, addr, order }) => (
          <div key={name} style={{
            display: "flex", alignItems: "center", gap: 14,
            background: order === 1 ? "rgba(200,139,58,0.05)" : "rgba(245,242,234,0.02)",
            border: `1px solid ${order === 1 ? "rgba(200,139,58,0.22)" : "rgba(245,242,234,0.06)"}`,
            borderRadius: 9, padding: "11px 16px",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: order === 1 ? "rgba(200,139,58,0.18)" : "rgba(245,242,234,0.05)",
              border: `1px solid ${order === 1 ? "rgba(200,139,58,0.50)" : "rgba(245,242,234,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 12, fontWeight: 700,
              color: order === 1 ? T.gold : T.ivoryDim,
            }}>{order}</div>
            <span style={{
              fontSize: 14, fontWeight: order === 1 ? 600 : 400,
              color: order === 1 ? T.ivory : T.ivoryDim,
              flex: 1, minWidth: 0,
            }}>{name}</span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: T.ivorySubtle }}>{addr}</span>
            <span style={{
              width: 90, textAlign: "right", flexShrink: 0,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              color: order === 1 ? T.gold : T.ivorySubtle,
              fontFamily: "Space Grotesk, sans-serif",
            }}>
              {order === 1 ? "Round 1 🏆" : `Round ${order}`}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: "10px 14px",
        background: "rgba(245,242,234,0.02)",
        border: "1px solid rgba(245,242,234,0.05)",
        borderRadius: 7,
        fontFamily: "monospace", fontSize: 11,
        color: T.ivorySubtle, wordBreak: "break-all", lineHeight: 1.6,
      }}>
        VRF Proof: 0x1b84c5567b126440995d3ed5aaba0565d71e183466d86a3ea6c55b2fa22da6de…
      </div>
    </div>
  );
}
