import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07111f",
          900: "#0c1726",
          800: "#172439",
          700: "#27364f",
          600: "#40516a",
        },
        paper: {
          50: "#fbfaf7",
          100: "#f5f2ec",
          200: "#e8e2d6",
        },
        civic: {
          50: "#effaf7",
          100: "#d8f1eb",
          500: "#2c8c7d",
          600: "#1f7167",
          700: "#175c55",
        },
        record: {
          50: "#f7f7fb",
          100: "#eceef4",
          200: "#d9dde8",
          300: "#b8c0d2",
        },
        notice: {
          50: "#fff8eb",
          100: "#f5e7c9",
          500: "#a26f19",
        },
      },
      boxShadow: {
        panel: "0 18px 50px rgba(7, 17, 31, 0.08)",
        line: "0 0 0 1px rgba(7, 17, 31, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
