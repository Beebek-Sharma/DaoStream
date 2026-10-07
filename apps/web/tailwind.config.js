/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0e1416',
          lowest: '#090f11',
          elevated: '#171d1e',
          card: '#1b2122',
          overlay: '#252b2d',
        },
        surface: {
          DEFAULT: '#0e1416',
          dim: '#0e1416',
          bright: '#343a3c',
          'container-lowest': '#090f11',
          'container-low': '#171d1e',
          container: '#1b2122',
          'container-high': '#252b2d',
          'container-highest': '#303638',
          variant: '#303638',
        },
        'on-surface': {
          DEFAULT: '#dee3e5',
          variant: '#94a3b8',
        },
        primary: {
          DEFAULT: '#0da1ba',
          light: '#61d6f0',
          hover: '#12b5d1',
          container: 'rgba(13, 161, 186, 0.15)',
          glow: 'rgba(13, 161, 186, 0.35)',
        },
        'on-primary': {
          DEFAULT: '#090f11',
          container: '#61d6f0',
        },
        secondary: {
          DEFAULT: '#ffb95f',
          cyan: '#a5cdd8',
          container: '#ee9800',
        },
        tertiary: {
          DEFAULT: '#93d5b0',
          container: '#60a07e',
        },
        outline: {
          DEFAULT: '#879396',
          variant: '#3d494c',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.16)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(13, 161, 186, 0.45)',
        'glow-cyan': '0 0 25px -5px rgba(97, 214, 240, 0.35)',
        'glow-amber': '0 0 25px -5px rgba(255, 185, 95, 0.3)',
        'cinematic': '0 20px 40px -15px rgba(0, 0, 0, 0.85)',
      },
    },
  },
  plugins: [],
}
