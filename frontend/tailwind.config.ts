import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/*.ts",
    "./src/*.tsx",
    "./src/pages/*.tsx"
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")[
              "[data-theme=light]"
          ],
          primary: "#3a59ff",
          secondary: "#ff3434",
          accent: "#37cdbe",
          neutral: "#3d4451",
          success: "#2fbc63",
          "base-100": "#f5f3ed",
          "base-200": "#e7e2d2",
          "base-300": "#afafaf"
        },
      },
    ],
  },
  theme: {
    extend: {
      boxShadow: {
        'zee': '0px 0 15px -2px #aaa',
      }
    }
  },
} satisfies Config
