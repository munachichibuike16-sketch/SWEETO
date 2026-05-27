/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        eas: {
          blue: '#0056b3',
          dark: '#003d80',
          light: '#e6f0ff',
          accent: '#00a8ff'
        }
      }
    },
  },
  plugins: [],
}
