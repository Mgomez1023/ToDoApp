import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        line: "var(--color-line)",
        ink: "var(--color-ink)",
        "ink-muted": "var(--color-ink-muted)",
        "ink-soft": "var(--color-ink-soft)",
        accent: "var(--color-accent)",
        "accent-strong": "var(--color-accent-strong)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
      },
      boxShadow: {
        shell: "0 24px 80px rgba(15, 23, 42, 0.08)",
        card: "0 14px 40px rgba(15, 23, 42, 0.06)",
        lift: "0 18px 45px rgba(15, 23, 42, 0.11)",
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
