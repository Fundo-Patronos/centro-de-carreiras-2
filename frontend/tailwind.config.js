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
          orange: '#ff9700',
          coral: '#ff6253',
          pink: '#fc4696',
          purple: '#c964e2',
          red: '#C00000',
          yellow: '#ff9700',
          // Centralized accent color - change this to update entire platform
          accent: '#c964e2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #ff9700, #ff6253, #fc4696, #c964e2)',
      }
    },
  },
  plugins: [],
}
