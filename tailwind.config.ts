import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--bg-void)",
        base: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        overlay: "var(--bg-overlay)",
        hover: "var(--bg-hover)",
        active: "var(--bg-active)",
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
          primary: "var(--border-primary)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
        green: {
          DEFAULT: "var(--accent-green)",
        },
        red: {
          DEFAULT: "var(--accent-red)",
        },
        yellow: {
          DEFAULT: "var(--accent-yellow)",
        },
        blue: {
          DEFAULT: "var(--accent-blue)",
        },
        purple: {
          DEFAULT: "var(--accent-purple)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
          accent: "var(--text-accent)",
          success: "var(--text-success)",
          danger: "var(--text-danger)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "Roboto",
          "Helvetica Neue", "Arial", "sans-serif",
        ],
        mono: [
          "ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas",
          "Liberation Mono", "monospace",
        ],
      },
      fontSize: {
        "display-xl": ["48px", { lineHeight: "1.10", letterSpacing: "-0.03em", fontWeight: "800" }],
        "display-lg": ["36px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["28px", { lineHeight: "1.20", letterSpacing: "-0.02em", fontWeight: "700" }],
        "heading-xl": ["24px", { lineHeight: "1.30", letterSpacing: "-0.01em", fontWeight: "600" }],
        "heading-lg": ["20px", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        "heading-md": ["18px", { lineHeight: "1.40", fontWeight: "600" }],
        "heading-sm": ["16px", { lineHeight: "1.40", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.60", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.60", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.50", fontWeight: "400" }],
        "label-lg": ["13px", { lineHeight: "1.40", letterSpacing: "0.02em", fontWeight: "500" }],
        "label-md": ["12px", { lineHeight: "1.40", letterSpacing: "0.03em", fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "1.30", letterSpacing: "0.05em", fontWeight: "600" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      spacing: {
        "4.5": "18px",
      },
      boxShadow: {
        l1: "0 0 0 1px var(--border-subtle)",
        l2: "0 0 0 1px var(--border-default), 0 4px 16px rgba(15,23,42,0.08)",
        l3: "0 0 0 1px var(--border-strong), 0 16px 48px rgba(15,23,42,0.16)",
        glow: "0 0 0 1px var(--primary), 0 0 20px var(--primary-glow)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-dot": {
          "0%, 80%, 100%": { opacity: "0.3" },
          "40%": { opacity: "1" },
        },
        "flip-card": {
          from: { transform: "rotateY(0deg)" },
          to: { transform: "rotateY(180deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-up": "slide-up 200ms ease-out",
        "slide-in-right": "slide-in-right 200ms ease-out",
        shimmer: "shimmer 1.5s linear infinite",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
        pop: "pop 600ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
