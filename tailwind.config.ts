import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        "surface-muted": "var(--color-surface-muted)",
        "surface-muted-strong": "var(--color-surface-muted-strong)",
        line: "var(--color-line)",
        "line-strong": "var(--color-line-strong)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        "ink-soft": "var(--color-ink-soft)",
        accent: "var(--color-accent)",
        "accent-strong": "var(--color-accent-strong)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        overlay: "var(--color-overlay)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
      },
      boxShadow: {
        shell: "var(--shadow-shell)",
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(58, 130, 246, 0.16), transparent 36%), radial-gradient(circle at top right, rgba(249, 115, 22, 0.14), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.95), rgba(249,250,251,0.88))",
      },
      fontFamily: {
        sans: ["\"Plus Jakarta Sans\"", "system-ui", "sans-serif"],
        mono: ["\"JetBrains Mono\"", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
