/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F1E6',
        paper: '#FBF9F3',
        sage: { 1: '#B7C29B', 2: '#8CA073', 3: '#5C6E48' },
        moss: '#3B4630',
        clay: { DEFAULT: '#B97A4E', dark: '#8F5B37' },
        stone: '#DAD3C1',
        ink: { DEFAULT: '#2B2820', soft: '#645D4C' },
        brand: { 50: '#EEF1E7', 100: '#DCE3D0', 500: '#6B7F52', 600: '#3B4630', 700: '#2B331F' },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
