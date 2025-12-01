export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        base: "var(--color-base)",
        "gradient-start": "var(--color-gradient-start)",
        "gradient-end": "var(--color-gradient-end)",
        accent: "var(--color-accent)",
        card: "var(--color-card)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      borderRadius: {
        premium: "20px",
      },
      boxShadow: {
        premium: "0 8px 24px rgba(0, 0, 0, 0.5)",
        "premium-hover": "0 12px 28px rgba(0, 0, 0, 0.7), 0 0 8px rgba(29, 78, 216, 0.2)",
      },
    },
  },
  plugins: [],
}