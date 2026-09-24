/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f6f3ec",
        ink: "#2a2722",
        mute: "#6b6458",
        line: "#e4ddd0",
        amber: {
          soft: "#c9a227",
          wash: "#f3ead0",
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(42, 39, 34, 0.06), 0 8px 24px rgba(42, 39, 34, 0.04)",
      },
    },
  },
  plugins: [],
};
