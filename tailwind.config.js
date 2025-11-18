/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bloomberg-orange': '#FF6600',
        'bloomberg-orange-dim': '#CC5500',
        'bloomberg-orange-bright': '#FF8833',
        'bloomberg-bg': '#0A0A0A',
        'bloomberg-panel': '#111111',
        'bloomberg-border': '#333333',
        'terminal': '#333333',
        'bloomberg-text': '#E0E0E0',
        'bloomberg-text-dim': '#999999',
        'bloomberg-green': '#00FF88',
        'bloomberg-red': '#FF4444',
        'bloomberg-yellow': '#FFAA00',
        'bloomberg-blue': '#4488FF',
      },
      borderColor: {
        'terminal': '#333333',
      },
    },
  },
  plugins: [],
}

