/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/*.jsx",
    "./src/pages/*.jsx"
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")[
              "[data-theme=light]"
          ],
          primary: "#3A59FF",
          secondary: "#FF3434",
          accent: "#37cdbe",
          neutral: "#3d4451",
          "base-100": "#ffffff",
        },
      },
    ],
  },
  theme: {
      extend: {},
  },
}
