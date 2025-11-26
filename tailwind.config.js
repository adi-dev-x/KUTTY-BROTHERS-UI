/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#CA8A06",
        "dark-yellow": "#B8860B",
      },
    },
  },
  plugins: [],
}
