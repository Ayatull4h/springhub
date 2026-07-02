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
        // SpringHub brand palette — warm navy + sky accent.
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7", // primary
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
        // Warm dark palette — match with cream logo (#faf9f7)
        night: {
          50: "#f5f3ef",  // warm cream — logo match
          100: "#d4d0cb",
          200: "#b3b0ab",
          300: "#92908c",
          400: "#7e7b77",
          500: "#55534f",
          600: "#3d3c39",
          700: "#1c232d", // elevated card
          800: "#141a22", // card / surface
          900: "#0b0f15", // body bg
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 15, 21, 0.04), 0 4px 16px rgba(11, 15, 21, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
