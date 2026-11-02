/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#14283A',
        teal: {
          DEFAULT: '#0E6B6F',
          dark: '#0B5558',
          light: '#E6F3F3',
        },
        safetyYellow: '#F2B705',
        page: '#F1F4F3',
        line: '#D5DDDA',
        statusOpen: {
          DEFAULT: '#B93A32',
          bg: '#FDEDEB',
        },
        statusProgress: {
          DEFAULT: '#8A5A00',
          bg: '#FEF6E6',
        },
        statusResolved: {
          DEFAULT: '#22724F',
          bg: '#EAF6F0',
        },
      },
      fontFamily: {
        sans: ['Carlito', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        card: '8px',
      },
    },
  },
  plugins: [],
}

