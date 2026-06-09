import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import LivingCircle, { DEMO_MEMBERS } from "../components/LivingCircle";
import { Logo } from "../components/Logo";

/* ─── colour tokens ──────────────────────────────────────── */
const T = {
  obsidian:    "#111111",
  ivory:       "#F5F2EA",
  ivoryDim:    "#A8A49C",
  ivorySubtle: "#6B6760",
  ivoryGhost:  "#3A3733",
  emerald:     "#0F6B50",
  emeraldBright:"#17A77A",
  gold:        "#C88B3A",
  goldBright:  "#E8A84A",
  slate:       "#46505A",
  surface1:    "#181818",
  surface2:    "#202020",
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
      fontSize: 11, fontWeight: 600,
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

function TechChip({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div style={{
      background: T.surface1,
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

/* ══════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ background: T.obsidian, color: T.ivory, overflowX: "hidden" }}>

      <style>{`
        @media (max-width: 768px) {
          .hero-headline  { font-size: 52px !important; }
          .two-col        { flex-direction: column !important; }
          .hero-circle    { max-width: 300px !important; margin: 0 auto !important; }
          .stats-row      { gap: 24px !important; }
          .proof-grid     { grid-template-columns: 1fr !important; }
          .tech-grid      { grid-template-columns: 1fr 1fr !important; }
          .footer-inner   { flex-direction: column !important; gap: 28px !important; text-align: center; }
        }
        @media (max-width: 480px) {
          .hero-headline  { font-size: 42px !important; }
          .cta-headline   { font-size: 44px !important; }
          .tech-grid      { grid-template-columns: 1fr !important; }
          .stats-row      { flex-direction: column !important; gap: 20px !important; }
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
          <div style={{ flex: "1 1 480px", minWidth: 0 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(15,107,80,0.10)", border: "1px solid rgba(15,107,80,0.28)",
              borderRadius: 20, padding: "6px 14px", marginBottom: 36,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.emeraldBright, flexShrink: 0 }} />
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
              lineHeight: 1.7, maxWidth: 440,
              marginBottom: 44, fontWeight: 400,
            }}>
              Autonomous savings circles for Africa and its diaspora —
              trustless, fair, and self-executing on Arbitrum.
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
              <a href="#how" className="btn-ghost" style={{
                background: "transparent", color: T.ivoryDim,
                border: "1px solid rgba(245,242,234,0.16)",
                borderRadius: 10, padding: "15px 32px",
                fontSize: 16, fontWeight: 500,
                fontFamily: "Space Grotesk, sans-serif",
                cursor: "pointer", transition: "all 0.2s",
                textDecoration: "none", display: "inline-block",
              }}>See how it works</a>
            </div>

            {/* Stats */}
            <div className="stats-row" style={{
              marginTop: 52,
              paddingTop: 28,
              borderTop: "1px solid rgba(245,242,234,0.07)",
              display: "flex", gap: 40, flexWrap: "wrap",
            }}>
              {[
                { val: "2B+",  label: "People save in circles globally" },
                { val: "$0",   label: "Coordinator risk" },
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

          {/* ── Circle ── */}
          <div className="hero-circle" style={{ flex: "0 1 440px", maxWidth: 440 }}>
            <LivingCircle
              members={DEMO_MEMBERS}
              potValue="$1,200"
              size={440}
              showGuardian={true}
              animate={true}
              round={3}
            />
          </div>
        </div>
      </section>

      {/* ════ TRUST BAR ══════════════════════════════ */}
      <div style={{
        background: T.surface1,
        borderTop: "1px solid rgba(245,242,234,0.06)",
        borderBottom: "1px solid rgba(245,242,234,0.06)",
        padding: "18px 28px",
        display: "flex", justifyContent: "center", overflow: "hidden",
      }}>
        <div style={{
          maxWidth: 1000, width: "100%",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          gap: 24, flexWrap: "wrap",
        }}>
          {[
            ["Arbitrum", "L2 Security"],
            ["Chainlink VRF", "Provable Fairness"],
            ["Chainlink Automation", "Self-Executing"],
            ["Aave v3", "Idle Yield"],
            ["EIP-1167 Clones", "Gas Efficient"],
          ].map(([name, desc]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.emerald, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T.ivorySubtle, whiteSpace: "nowrap" }}>
                <span style={{ color: T.ivoryDim, fontWeight: 500 }}>{name}</span>
                {" · "}{desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ════ PROBLEM ════════════════════════════════ */}
      <section style={{ background: T.obsidian, padding: "120px 28px" }}>
        <div style={container}>
          <Reveal>
            <div style={{ maxWidth: 700 }}>
              <Eyebrow>THE PROBLEM</Eyebrow>
              <h2 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 48, fontWeight: 700,
                letterSpacing: "-0.035em", lineHeight: 1.1,
                color: T.ivory, marginBottom: 20,
              }}>
                2 billion people save<br />
                in circles. None of them<br />
                <span style={{ color: T.gold }}>trust the coordinator.</span>
              </h2>
              <p style={{ fontSize: 17, color: T.ivoryDim, lineHeight: 1.75, maxWidth: 520 }}>
                <span style={{ color: T.ivory, fontStyle: "italic" }}>Ajo. Esusu. Chama. Stokvel.</span>
                {" "}Africa's names for rotating savings circles — a model that moves
                hundreds of billions of dollars every year, entirely on trust.
                That trust has always been the vulnerability: one human coordinator
                who can disappear, play favourites, or simply forget.
              </p>
            </div>
          </Reveal>

          <div className="proof-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2, marginTop: 64,
          }}>
            {[
              { stat: "40%",   label: "of informal savings groups experience coordinator fraud or mismanagement", col: T.gold },
              { stat: "∞",     label: "Disputes over rotation order — who goes first, who goes last, every cycle", col: T.ivoryDim },
              { stat: "$0",    label: "Yield on idle USDC sitting in a coordinator's personal bank account",       col: T.ivoryDim },
            ].map(({ stat, label, col }) => (
              <Reveal key={stat}>
                <div style={{
                  background: T.surface1,
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

      {/* ════ THE LIVING CIRCLE ══════════════════════ */}
      <section style={{ background: T.surface1, padding: "120px 28px" }}>
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
                The circle communicates everything. Who paid. Who hasn't.
                Who receives next. How much is in the pot. No charts. No confusion.
              </p>
            </div>
          </Reveal>

          <div className="two-col" style={{
            display: "flex", alignItems: "center",
            gap: 80, justifyContent: "center",
          }}>
            <div className="hero-circle" style={{ flex: "0 0 360px", maxWidth: 360 }}>
              <LivingCircle
                members={DEMO_MEMBERS}
                potValue="$1,200"
                size={360}
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
      <section id="how" style={{ background: T.obsidian, padding: "120px 28px" }}>
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
                body: "Set contribution amount, group size, and rotation frequency. Share a link. The smart contract becomes the permanent coordinator — no human needed.",
              },
              {
                n: "02", color: T.gold, tag: "Chainlink VRF",
                title: "Provably fair rotation order",
                body: "Chainlink VRF generates tamper-proof randomness on-chain at creation. Nobody — not the creator, not ArbiCycle — can predict or influence who goes when.",
              },
              {
                n: "03", color: T.emeraldBright, tag: "Chainlink Automation + Aave",
                title: "Guardian executes automatically",
                body: "Each round, members contribute. Circle Guardian collects, distributes the pot, earns yield on idle USDC via Aave v3. Rotation triggers itself when the time comes.",
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

      {/* ════ CIRCLE GUARDIAN ════════════════════════ */}
      <section style={{ background: T.surface1, padding: "120px 28px" }}>
        <div style={container}>
          <div className="two-col" style={{ display: "flex", gap: 80, alignItems: "center" }}>
            <div style={{ flex: "0 0 280px", maxWidth: 280 }}>
              <GuardianVisual />
            </div>
            <div style={{ flex: "1 1 360px" }}>
              <Reveal>
                <Eyebrow color={T.gold}>CIRCLE GUARDIAN</Eyebrow>
                <h2 style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 40, fontWeight: 700,
                  letterSpacing: "-0.035em", lineHeight: 1.12,
                  color: T.ivory, marginBottom: 20,
                }}>
                  An intelligence layer<br />
                  <span style={{ color: T.gold }}>that never sleeps.</span>
                </h2>
                <p style={{ fontSize: 16, color: T.ivoryDim, lineHeight: 1.75, marginBottom: 32 }}>
                  Circle Guardian is not a bot. It's the autonomous execution layer
                  powered by Chainlink Automation — watching every circle, every round,
                  enforcing every rule without a human operator.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    "Triggers rotation precisely at deadline",
                    "Distributes the full pot to the verified recipient",
                    "Earns Aave v3 yield on idle contributions",
                    "Applies on-chain penalties for missed contributions",
                    "Builds an immutable reputation score for every member",
                  ].map(item => (
                    <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "rgba(15,107,80,0.15)", border: "1px solid rgba(15,107,80,0.38)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, marginTop: 2,
                      }}>
                        <span style={{ fontSize: 9, color: T.emeraldBright }}>✓</span>
                      </div>
                      <span style={{ fontSize: 14, color: T.ivoryDim, lineHeight: 1.6 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ════ VRF FAIRNESS ═══════════════════════════ */}
      <section style={{ background: T.obsidian, padding: "120px 28px" }}>
        <div style={{ ...container, textAlign: "center" }}>
          <Reveal>
            <Eyebrow color={T.gold}>CHAINLINK VRF</Eyebrow>
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
              When a circle is created, Chainlink VRF generates a provably random
              rotation order on-chain. Immutable. Verifiable. Fair forever.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <VRFVisual />
          </Reveal>
        </div>
      </section>

      {/* ════ TECHNOLOGY ═════════════════════════════ */}
      <section style={{ background: T.surface1, padding: "100px 28px" }}>
        <div style={container}>
          <Reveal>
            <Eyebrow>TECHNOLOGY</Eyebrow>
            <h2 style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 36, fontWeight: 700,
              letterSpacing: "-0.03em", color: T.ivory,
              marginBottom: 48,
            }}>Infrastructure that earns trust.</h2>
          </Reveal>
          <div className="tech-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <TechChip label="ARBITRUM" color={T.emerald}
              sub="L2 rollup gives sub-cent transactions with Ethereum security. The fee structure makes micro-contributions viable for the first time." />
            <TechChip label="CHAINLINK VRF" color={T.gold}
              sub="Verifiable Random Function produces tamper-proof randomness for rotation order. The proof lives on-chain, auditable forever." />
            <TechChip label="CHAINLINK AUTOMATION" color={T.emerald}
              sub="Decentralized keepers monitor circle deadlines and trigger rotations automatically. No server. No cron job. No human." />
            <TechChip label="AAVE V3" color={T.gold}
              sub="Idle USDC in the pot earns real yield via Aave while waiting for distribution. Your savings work even while they wait." />
            <TechChip label="EIP-1167 CLONES" color={T.emerald}
              sub="Each circle is a gas-efficient proxy clone. Creating a new savings circle costs less than a cent on Arbitrum." />
            <TechChip label="USDC · STABLE" color={T.ivoryDim}
              sub="All contributions and payouts are in USDC. Price stability keeps everyone focused on community savings, not speculation." />
          </div>
        </div>
      </section>

      {/* ════ FINAL CTA ══════════════════════════════ */}
      <section style={{
        background: T.obsidian, padding: "140px 28px",
        textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(15,107,80,0.07) 0%, transparent 70%)",
        }} />
        <div style={{ ...container, position: "relative", zIndex: 1 }}>
          <Reveal>
            <Eyebrow color={T.gold}>JOIN THE CIRCLE</Eyebrow>
            <h2 className="cta-headline" style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 60, fontWeight: 700,
              letterSpacing: "-0.045em", lineHeight: 1.05,
              color: T.ivory, marginBottom: 20,
            }}>
              Wealth moves<br />
              <span style={{ color: T.gold }}>in circles.</span>
            </h2>
            <p style={{
              fontSize: 17, color: T.ivoryDim,
              maxWidth: 400, margin: "0 auto 44px",
              lineHeight: 1.75,
            }}>
              Create your first savings circle in 60 seconds.
              No bank. No coordinator. No trust required.
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
            >Start Saving — Free</button>
            <p style={{ marginTop: 18, fontSize: 13, color: T.ivorySubtle }}>
              Deployed on Arbitrum Sepolia. No fees during testnet.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ════ FOOTER ═════════════════════════════════ */}
      <footer style={{
        background: T.surface1,
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
              { label: "GitHub",   href: "https://github.com" },
              { label: "Docs",     href: "#" },
              { label: "Arbitrum", href: "https://arbitrum.io" },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="footer-link"
                style={{ fontSize: 13, color: T.ivorySubtle, textDecoration: "none", transition: "color 0.15s" }}>
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: T.ivorySubtle }}>
            Arbitrum Open House · London 2026
          </p>
        </div>
      </footer>

    </div>
  );
}


/* ─── Guardian Visual ────────────────────────────────────── */
function GuardianVisual() {
  return (
    <svg viewBox="0 0 280 280" width="100%" style={{ maxWidth: 280, display: "block" }}>
      <defs>
        <radialGradient id="gc" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#202020" />
          <stop offset="100%" stopColor="#111111" />
        </radialGradient>
      </defs>
      <g style={{ transformOrigin: "140px 140px", animation: "guardian-orbit 28s linear infinite" }}>
        <circle cx="140" cy="140" r="128" fill="none" stroke="rgba(200,139,58,0.13)" strokeWidth="1"   strokeDasharray="3 10" />
      </g>
      <g style={{ transformOrigin: "140px 140px", animation: "guardian-orbit 18s linear infinite reverse" }}>
        <circle cx="140" cy="140" r="106" fill="none" stroke="rgba(15,107,80,0.22)"  strokeWidth="1.5" strokeDasharray="3 7" />
      </g>
      <g style={{ transformOrigin: "140px 140px", animation: "guardian-orbit 11s linear infinite" }}>
        <circle cx="140" cy="140" r="84"  fill="none" stroke="rgba(200,139,58,0.28)" strokeWidth="1"   strokeDasharray="2 5" />
      </g>
      <circle cx="140" cy="140" r="52" fill="url(#gc)" stroke="rgba(200,139,58,0.28)" strokeWidth="1.5" />
      <circle cx="140" cy="140" r="30" fill="none" stroke="rgba(15,107,80,0.30)" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="140" cy="140" r="8"  fill="#C88B3A" opacity="0.88"
        style={{ animation: "center-breathe 4s ease-in-out infinite" }} />
      <text x="140" y="218" textAnchor="middle"
        fill="rgba(200,139,58,0.45)" fontSize="9"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="600" letterSpacing="0.12em">CIRCLE GUARDIAN</text>
    </svg>
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
  const sorted = [...members].sort((a, b) => a.order - b.order);

  return (
    <div style={{
      background: "#141414",
      border: "1px solid rgba(200,139,58,0.14)",
      borderRadius: 18, padding: "36px 32px",
      maxWidth: 640, margin: "0 auto",
    }}>
      {/* Header */}
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

      {/* Column labels */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "6px 16px 10px",
        fontSize: 10, fontWeight: 600, letterSpacing: "0.09em",
        color: T.ivorySubtle,
        fontFamily: "Space Grotesk, sans-serif",
      }}>
        <span style={{ width: 26, textAlign: "center", flexShrink: 0 }}>#</span>
        <span style={{ flex: 1 }}>MEMBER NAME</span>
        <span style={{ fontSize: 10, color: T.ivorySubtle }}>WALLET</span>
        <span style={{ width: 90, textAlign: "right", flexShrink: 0 }}>RECEIVES POT</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map(({ name, addr, order }) => (
          <div key={name} style={{
            display: "flex", alignItems: "center", gap: 14,
            background: order === 1 ? "rgba(200,139,58,0.05)" : "rgba(245,242,234,0.02)",
            border: `1px solid ${order === 1 ? "rgba(200,139,58,0.22)" : "rgba(245,242,234,0.06)"}`,
            borderRadius: 9, padding: "11px 16px",
          }}>
            {/* Position bubble */}
            <div style={{
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              background: order === 1 ? "rgba(200,139,58,0.18)" : "rgba(245,242,234,0.05)",
              border: `1px solid ${order === 1 ? "rgba(200,139,58,0.50)" : "rgba(245,242,234,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Space Grotesk, sans-serif",
              fontSize: 12, fontWeight: 700,
              color: order === 1 ? T.gold : T.ivoryDim,
            }}>{order}</div>

            {/* Name */}
            <span style={{
              fontSize: 14, fontWeight: order === 1 ? 600 : 400,
              color: order === 1 ? T.ivory : T.ivoryDim,
              flex: 1, minWidth: 0,
            }}>{name}</span>

            {/* Wallet address */}
            <span style={{
              fontFamily: "monospace", fontSize: 11,
              color: T.ivorySubtle,
            }}>{addr}</span>

            {/* Round label */}
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

      {/* VRF proof footer */}
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
