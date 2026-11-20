/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#ff6a00', 600: '#e65f00', 400: '#ff8a33' },
        ink: { 950: '#0a0a0a', 900: '#121212', 800: '#1a1a1a', 700: '#242424', 600: '#2e2e2e' },
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '.25' } },
        fadein: { from: { opacity: '0' }, to: { opacity: '1' } },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        blink: 'blink 1.2s ease-in-out infinite',
        fadein: 'fadein .6s ease-out',
      },
      fontFamily: {
        sans: ['Prompt', 'Kanit', 'system-ui', 'sans-serif'],
        display: ['Kanit', 'Prompt', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
