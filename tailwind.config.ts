import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17201b",
        paper: "#f8faf7",
        moss: "#46624a",
        mint: "#d7ede2",
        copper: "#a65f3d",
        slateblue: "#415a77"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 32, 27, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
