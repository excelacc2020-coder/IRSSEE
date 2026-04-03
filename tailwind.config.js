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
        th: {
          bg: 'rgb(var(--color-bg-app) / <alpha-value>)',
          sidebar: 'rgb(var(--color-bg-sidebar) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          input: 'rgb(var(--color-bg-input) / <alpha-value>)',
          hover: 'rgb(var(--color-bg-hover) / <alpha-value>)',
          active: 'rgb(var(--color-bg-active) / <alpha-value>)',
          overlay: 'rgb(var(--color-bg-overlay) / <alpha-value>)',
          text: 'rgb(var(--color-text) / <alpha-value>)',
          'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
          'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
          'text-faint': 'rgb(var(--color-text-faint) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          'border-strong': 'rgb(var(--color-border-strong) / <alpha-value>)',
          'accent-bg': 'rgb(var(--color-accent-bg) / <alpha-value>)',
          'accent-bg-strong': 'rgb(var(--color-accent-bg-strong) / <alpha-value>)',
          'accent-border': 'rgb(var(--color-accent-border) / <alpha-value>)',
          'accent-text': 'rgb(var(--color-accent-text) / <alpha-value>)',
        },
      },
      animation: {
        'flip': 'flip 0.6s ease-in-out',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
      },
    },
  },
  plugins: [],
}
