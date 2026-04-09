/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Poppins", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(15, 23, 42, 0.08), 0 8px 32px -8px rgba(15, 23, 42, 0.06)",
        "soft-lg": "0 12px 40px -12px rgba(15, 23, 42, 0.12), 0 4px 16px -4px rgba(15, 23, 42, 0.06)",
        "sos-glow": "0 0 48px -4px rgba(239, 68, 68, 0.45), 0 16px 48px -12px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fade-in 0.45s ease-out forwards",
        "card-in": "card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "card-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
