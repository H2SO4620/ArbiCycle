/**
 * Premium cinematic atmosphere — fixed, full-viewport, behind all content.
 * Layers: obsidian base -> emerald orbital diffusion -> ivory core glow ->
 * copper accent -> film grain -> edge vignette. Ultra-slow drift/pulse only.
 */
export default function CinematicBackground() {
  return (
    <div className="cinematic-bg" aria-hidden="true">
      <style>{`
        @keyframes cb-drift-tl {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(3%, 4%, 0) scale(1.06); }
        }
        @keyframes cb-drift-br {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(-4%, -3%, 0) scale(1.08); }
        }
        @keyframes cb-pulse-core {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.85; transform: translate(-50%, -50%) scale(1.04); }
        }
        @keyframes cb-pulse-copper {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.75; }
        }

        .cinematic-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #111111;
          pointer-events: none;
        }
        .cb-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(140px);
          will-change: transform, opacity;
        }
        .cb-emerald-tl {
          top: -35%; left: -28%;
          width: 95vw; height: 95vw;
          background: radial-gradient(circle, rgba(15,107,80,0.32) 0%, rgba(15,107,80,0) 70%);
          animation: cb-drift-tl 100s ease-in-out infinite;
        }
        .cb-emerald-br {
          bottom: -40%; right: -32%;
          width: 105vw; height: 105vw;
          background: radial-gradient(circle, rgba(15,107,80,0.26) 0%, rgba(15,107,80,0) 70%);
          animation: cb-drift-br 130s ease-in-out infinite;
        }
        .cb-ivory-core {
          top: 48%; left: 50%;
          width: 75vw; height: 75vw;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(245,242,234,0.055) 0%, rgba(245,242,234,0) 65%);
          animation: cb-pulse-core 28s ease-in-out infinite;
        }
        .cb-copper {
          top: 22%; right: 6%;
          width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(200,139,58,0.13) 0%, rgba(200,139,58,0) 70%);
          animation: cb-pulse-copper 36s ease-in-out infinite;
        }
        .cb-grain {
          position: absolute;
          inset: -200px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.035;
          mix-blend-mode: overlay;
        }
        .cb-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(17,17,17,0.7) 100%);
        }

        @media (prefers-reduced-motion: reduce) {
          .cb-emerald-tl, .cb-emerald-br, .cb-ivory-core, .cb-copper {
            animation: none;
          }
        }
      `}</style>

      <div className="cb-glow cb-emerald-tl" />
      <div className="cb-glow cb-emerald-br" />
      <div className="cb-glow cb-ivory-core" />
      <div className="cb-glow cb-copper" />
      <div className="cb-grain" />
      <div className="cb-vignette" />
    </div>
  );
}
