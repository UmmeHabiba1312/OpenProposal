import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12141A",
        paper: "#F6F1E7",
        seal: "#C1502E",
        gold: "#D9A441",
        moss: "#3F5E53",
        muted: "#8A8578",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
