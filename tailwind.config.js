/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        accent: "var(--accent)",
        "accent-purple": "var(--accent-purple)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--gradient-start), var(--gradient-end))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--gradient-start), var(--gradient-end))",
      },
      transitionDuration: {
        fast: "var(--transition-fast)",
        medium: "var(--transition-medium)",
        slow: "var(--transition-slow)",
      },
      boxShadow: {
        elevation: "var(--shadow-elevation)",
        glow: "var(--shadow-glow)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
    },
  },
  plugins: [],
}
