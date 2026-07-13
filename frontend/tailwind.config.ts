import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        border: "#e5e7eb",
        surface: "#ffffff",
        canvas: "#fafafa",
        ink: {
          900: "#111113",
          700: "#3f3f46",
          500: "#71717a",
          300: "#d4d4d8",
        },
        accent: {
          DEFAULT: "#16a34a",
          soft: "#f0fdf4",
        },
        danger: {
          DEFAULT: "#dc2626",
          soft: "#fef2f2",
        },
        warn: {
          DEFAULT: "#d97706",
          soft: "#fffbeb",
        },
      },
      fontSize: {
        xs: ["0.75rem", "1rem"],
        sm: ["0.8125rem", "1.125rem"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
