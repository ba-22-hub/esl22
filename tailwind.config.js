/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        rayonblue: "#3435FF",
        rayonorange: "#FF8200",
        rayonlightblue: "#0080ffff",
        red : "#ff0000"

      },
    },
  },
  plugins: [],
}
