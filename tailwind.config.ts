import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        ink: {
          DEFAULT: "#0b0f15",
          muted: "#475569",
          subtle: "#94a3b8",
          line: "#e2e8f0",
        },
        night: {
          50: "#f5f3ef",
          100: "#d4d0cb",
          200: "#b3b0ab",
          300: "#92908c",
          400: "#7e7b77",
          500: "#55534f",
          600: "#3d3c39",
          700: "#1c232d",
          800: "#141a22",
          900: "#0b0f15",
        },
        earth: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 15, 21, 0.04), 0 4px 16px rgba(11, 15, 21, 0.04)",
        elevated: "0 4px 6px -1px rgba(11, 15, 21, 0.06), 0 10px 28px -4px rgba(11, 15, 21, 0.08)",
        modal: "0 20px 60px rgba(11, 15, 21, 0.15)",
      },
      animation: {
        fade: "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.5s ease-out",
        "scale-in": "scaleIn 0.35s ease-out",
        shimmer: "shimmer 1.5s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
