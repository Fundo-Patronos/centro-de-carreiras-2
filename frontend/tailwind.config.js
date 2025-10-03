/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'patronos': {
          primary: '#1e40af', // Azul
          secondary: '#f59e0b', // Laranja
          accent: '#10b981', // Verde
        }
      }
    },
  },
  plugins: [],
}
