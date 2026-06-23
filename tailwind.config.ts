import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0C",
        surface: "#131316",
        s2: "#1A1A1F",
        s3: "#222228",
        accent: "#00E5A0",
        a2: "#FFB800",
        danger: "#FF5757",
        blue: "#4A9EFF",
        "text-main": "#F2F2F2",
        muted: "#888896",
        border: "#252530",
      },
      fontFamily: {
        heading: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
