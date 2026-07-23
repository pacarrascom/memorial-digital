import type { Config } from "tailwindcss";

// Sistema de diseño Dorsera Memorial
// Paleta: ink (texto/fondo oscuro), stone (neutro base), moss (acento vida/legado),
// flame (acento cálido — vela, momentos especiales), mist (superficies suaves), ash (bordes/divisores)
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C1B18",
          50: "#F6F5F3",
          100: "#E8E6E1",
          400: "#5C5A54",
          700: "#2E2C28",
          900: "#1C1B18",
        },
        stone: {
          DEFAULT: "#EDE9E1",
          50: "#FAF9F6",
          100: "#F3F1EC",
          200: "#EDE9E1",
          300: "#DDD7CB",
        },
        moss: {
          DEFAULT: "#5C6E58",
          400: "#7A8C74",
          600: "#5C6E58",
          800: "#3C4A39",
        },
        flame: {
          DEFAULT: "#C77A3F",
          400: "#D99A63",
          600: "#C77A3F",
        },
        mist: {
          DEFAULT: "#F1F0EE",
          night: "#232220", // "modo noche de vigilia", no negro puro
        },
        ash: {
          DEFAULT: "#D8D3C8",
          night: "#3A3835",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-public-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      keyframes: {
        "candle-flicker": {
          "0%, 100%": { opacity: "1", transform: "scaleY(1)" },
          "50%": { opacity: "0.85", transform: "scaleY(0.96)" },
        },
        "ribbon-draw": {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
      },
      animation: {
        "candle-flicker": "candle-flicker 2.4s ease-in-out infinite",
        "ribbon-draw": "ribbon-draw 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
