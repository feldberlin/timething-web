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
          secondary: "#ff3434",
          accent: "#37cdbe",
          neutral: "#3d4451",
          success: "#2fbc63",
          "base-100": "#f5f3ed",
          "base-200": "#e7e2d2"
        },
      },
    ],
  },
  theme: {
    extend: { }
  },
}
