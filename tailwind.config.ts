import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: "var(--color-ground)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        "surface-inset": "var(--color-surface-inset)",
        border: "var(--color-border)",
        "border-2": "var(--color-border-2)",

        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",

        accent: "var(--color-accent)",
        "accent-dim": "var(--color-accent-dim)",
        provenance: "var(--color-provenance)",
        datum: "var(--color-datum)",
        link: "var(--color-link)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",

        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Newsreader", "Georgia", "serif"],
        ui: ["var(--font-ui)", "Geist", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        md: "3px",
        lg: "4px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;

