/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./apps/**/*.{js,ts,jsx,tsx}",
    "./core/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Win95 color palette
        'win95-gray': '#c0c0c0',
        'win95-dark-gray': '#808080',
        'win95-white': '#ffffff',
        'win95-black': '#000000',
        'win95-navy': '#000080',
        'win95-teal': '#008080',
      },
      fontFamily: {
        'win95': ['MS Sans Serif', 'Microsoft Sans Serif', 'sans-serif'],
        'win95-mono': ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
