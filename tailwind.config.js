/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        "background": "#0f1117",
        "surface": "#161922",
        "surface-dim": "#11131a",
        "border-subtle": "#262a38",
        "primary": "#00f5a0",
        "primary-container": "#00f5a0",
        "on-primary": "#052e16",
        "secondary": "#38bdf8",
        "on-surface": "#f1f5f9",
        "on-background": "#f1f5f9",
        "status-healthy": "#10b981",
        "status-at-risk": "#fbbf24",
        "status-degraded": "#fbbf24",
        "status-failed": "#f43f5e",
        "status-recovering": "#00f5a0",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        mint: {
          400: "#00f5a0",
          500: "#10b981",
          600: "#059669",
          900: "#064e3b",
          950: "#022c22",
        },
        zinc: {
          850: "#1e212b",
          900: "#161922",
          950: "#0f1117",
        },
        status: {
          healthy: "#10b981",
          at_risk: "#fbbf24",
          degraded: "#fbbf24",
          failed: "#f43f5e",
          recovering: "#00f5a0",
        }
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.375rem",
        xl: "0.5rem",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        heading: ["Outfit", "Plus Jakarta Sans", "sans-serif"],
        "telemetry-label": ["JetBrains Mono", "monospace"],
        "telemetry-data": ["JetBrains Mono", "monospace"],
        timestamp: ["JetBrains Mono", "monospace"],
        "headline-md": ["Outfit", "Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Outfit", "Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Plus Jakarta Sans", "sans-serif"],
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "cascade-flow": {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        }
      },
      animation: {
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radar-sweep 8s linear infinite",
        "cascade-flow": "cascade-flow 1s linear infinite",
      },
    },
  },
  plugins: [],
}
