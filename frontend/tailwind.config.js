/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        patronos: {
          orange: '#ff9700',
          coral: '#ff6253',
          pink: '#fc4696',
          purple: '#c964e2',
          accent: '#ff9700', // Primary accent color - change here to update platform
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'patronos-gradient': 'linear-gradient(135deg, #ff9700, #ff6253, #fc4696, #c964e2)',
      },
    },
  },
  plugins: [],
}
