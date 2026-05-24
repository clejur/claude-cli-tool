/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E07A5F',
        secondary: '#81B29A',
        accent: '#F2CC8F',
        extra: {
          1: '#F4A261',
          2: '#9B7EDE',
          3: '#5B9BD5',
        },
        surface: {
          bg: '#FDF8F4',
          alt: '#FFF5EE',
          card: '#FFFFFF',
          dark: '#3D405B',
        },
        content: {
          DEFAULT: '#3D405B',
          muted: '#6B6E8A',
          subtle: '#9A9CB8',
        },
        border: '#F0E6DE',
      },
      fontFamily: {
        heading: ['Fredoka', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        pill: '50px',
        input: '16px',
      },
    },
  },
  plugins: [],
}
