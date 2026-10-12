import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        samudra: { 50: "#eef7fa", 100: "#d5ebf2", 200: "#aad6e5", 300: "#6fb7d0", 400: "#3a95b6", 500: "#1f7a9c", 600: "#176282", 700: "#154f69", 800: "#143f54", 900: "#0c2a3a" },
        toska: { 50: "#e9fbf8", 100: "#c6f4ed", 200: "#93e8dc", 300: "#58d6c8", 400: "#26bdb0", 500: "#13a095", 600: "#0f8179", 700: "#106761", 800: "#115350", 900: "#0f4442" },
        daun: { 50: "#f0f8f1", 100: "#dcefde", 200: "#bbdfc0", 300: "#8ec999", 400: "#5eab6d", 500: "#3d8e50", 600: "#2d723e", 700: "#255b34", 800: "#20492b", 900: "#1b3d25" },
        karang: { 500: "#e8643f", 600: "#cf4e2b" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: { lembut: "0 1px 2px rgba(12,42,58,.06), 0 8px 24px -12px rgba(12,42,58,.18)" },
    },
  },
  plugins: [],
};
export default config;
