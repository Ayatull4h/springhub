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
        /* Palet gaya BKKCAW untuk landing (staging): ungu tua + biru cerah */
        bkk: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e2ccf9",
          500: "#8b46c7",
          600: "#7a2fb8",
          700: "#67279f",
          800: "#521f7d",
          900: "#3d1660",
        },
        bkkblue: {
          100: "#d9ecfd",
          200: "#b3d9fb",
          500: "#1e9bf0",
          600: "#1583cf",
        },
        bkksun: "#ffc53d",
        bkkpink: {
          100: "#fde3ef",
          500: "#ef4da0",
          600: "#d63a86",
          700: "#b42a6c",
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
        display: ["var(--font-lexend)", "var(--font-inter)", "system-ui", "sans-serif"],
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
