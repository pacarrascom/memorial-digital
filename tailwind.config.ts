import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#23282A',
        stone: '#EDE7DD',
        moss: '#5B6F5B',
        flame: '#C9932E',
        mist: '#F7F4EE',
        ash: '#D8D2C4',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Public Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
