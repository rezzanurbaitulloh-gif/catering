import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF7F2",
        ink: "#1C1917",
        gold: { DEFAULT: "#B45309", soft: "#F5E6C8", deep: "#92400E" },
        leaf: "#3F6212",
        clay: "#9A3412",
        line: "#E7E0D4",
        muted: "#78716C",
        night: "#141210",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "'Times New Roman'", "serif"],
        body: ["Inter", "system-ui", "-apple-system", "'Segoe UI'", "sans-serif"],
      },
      borderRadius: { brand: "14px" },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
    },
  },
  plugins: [],
};

export default config;
