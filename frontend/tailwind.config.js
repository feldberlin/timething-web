/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: "#aaa",
        primary: "#333",
        "accent-pink": "#FC9CC6",
        "accent-blue": "#3A59FF",
      },
    },
  },
  plugins: [require("daisyui")],
}
