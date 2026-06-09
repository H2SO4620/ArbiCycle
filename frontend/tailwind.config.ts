import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#111111",
        ivory: {
          DEFAULT: "#F5F2EA",
          dim: "#A8A49C",
          subtle: "#6B6760",
          ghost: "#3A3733",
        },
        emerald: {
          DEFAULT: "#0F6B50",
          bright: "#17A77A",
          dim: "#0A4A38",
          glow: "rgba(15,107,80,0.20)",
        },
        gold: {
          DEFAULT: "#C88B3A",
          bright: "#E8A84A",
          dim: "#8A5E20",
          glow: "rgba(200,139,58,0.20)",
        },
        slate: {
          DEFAULT: "#46505A",
          dark: "#2C333A",
          light: "#8A939E",
        },
        surface: {
          0: "#111111",
          1: "#181818",
          2: "#202020",
          3: "#2A2A2A",
          border: "rgba(245,242,234,0.08)",
        },
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.03em",
        tight:    "-0.02em",
      },
    },
  },
  plugins: [],
} satisfies Config;
