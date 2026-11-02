import type { Config } from "tailwindcss";
// Palette taken from the Review 1 deck.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        crimson: { DEFAULT: "#9A0012", dark: "#6E000D", soft: "#F6E3E5" },
        navy: { DEFAULT: "#2D3A7C", dark: "#1F2956", soft: "#E4E7F3" },
        cream: "#FCF6F3",
        blush: "#E8E1E1",
        ink: "#241F20",
        mute: "#6F6869",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 6px 22px rgba(80,30,40,0.08)" },
    },
  },
  plugins: [],
};
export default config;
