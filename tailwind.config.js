/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          light: '#f4ecd8',
          dark: '#5c4b37',
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
