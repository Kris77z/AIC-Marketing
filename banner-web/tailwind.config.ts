import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111318",
        mist: "#eef3ef",
        peach: "#f4c3a2",
        gold: "#c28c3d",
        moss: "#6c7b63",
        board: "#f7f3ec"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(17, 19, 24, 0.08)"
      },
      fontFamily: {
        sans: ["Space Grotesk", "Manrope", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
