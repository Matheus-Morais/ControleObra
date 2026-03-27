/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#F5F0E8",
          100: "#EDE5D6",
          200: "#E8DCC8",
          300: "#D9CAB0",
          400: "#C4B08E",
          500: "#A89270",
          600: "#8C7658",
          700: "#6E5B42",
          800: "#50412F",
          900: "#33291E",
        },
        terracotta: {
          50: "#F9EDE8",
          100: "#F0D4CA",
          200: "#E4B5A5",
          300: "#D89680",
          400: "#CC785C",
          500: "#C1694F",
          600: "#A85740",
          700: "#8A4634",
          800: "#6C3628",
          900: "#4E261C",
        },
        moss: {
          50: "#EEF2ED",
          100: "#D5DFD2",
          200: "#B5C9B0",
          300: "#8FAD88",
          400: "#6F9366",
          500: "#5B7553",
          600: "#4A6043",
          700: "#3A4B35",
          800: "#2A3727",
          900: "#1A2319",
        },
        cream: {
          DEFAULT: "#FAFAF8",
          dark: "#F0EDE6",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
