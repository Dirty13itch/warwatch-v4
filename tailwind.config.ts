import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Rajdhani'", "system-ui", "sans-serif"],
        body: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"]
      },
      colors: {
        backdrop: "#07111b",
        shell: "#0b1621",
        panel: "#102130",
        line: "#20384a",
        signal: "#59d3ff",
        ember: "#ff7a59",
        warning: "#ffc857",
        hostile: "#ff4d5e",
        calm: "#b7c7d6"
      },
      boxShadow: {
        shell: "0 24px 64px rgba(4, 11, 18, 0.48)"
      },
      backgroundImage: {
        radar:
          "radial-gradient(circle at 20% 20%, rgba(89, 211, 255, 0.18), transparent 40%), radial-gradient(circle at 80% 10%, rgba(255, 122, 89, 0.12), transparent 35%), linear-gradient(180deg, rgba(11, 22, 33, 0.92), rgba(7, 17, 27, 0.98))"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -8px, 0)" }
        },
        pulseGrid: {
          "0%, 100%": { opacity: "0.24" },
          "50%": { opacity: "0.5" }
        }
      },
      animation: {
        drift: "drift 14s ease-in-out infinite",
        pulseGrid: "pulseGrid 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
} satisfies Config;

