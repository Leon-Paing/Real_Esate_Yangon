/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      colors: {
        surface: "#161b22",
        "text-muted": "#8b949e",
        accent: "#2ea043",
        gold: "#d4a853",
      },
    },
  },
  plugins: [],
};
