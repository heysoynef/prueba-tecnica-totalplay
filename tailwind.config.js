/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#111827",
        muted: "#6b7280",
        line: "#e5e7eb",
        surface: "#f5f5f6"
      }
    }
  },
  plugins: []
};
