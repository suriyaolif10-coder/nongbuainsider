/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#ff6a00', 600: '#e65f00', 400: '#ff8a33' },
        ink: { 950: '#0a0a0a', 900: '#121212', 800: '#1a1a1a', 700: '#242424', 600: '#2e2e2e' },
      },
      fontFamily: {
        sans: ['Prompt', 'Kanit', 'system-ui', 'sans-serif'],
        display: ['Kanit', 'Prompt', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
