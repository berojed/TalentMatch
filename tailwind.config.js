/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surface tokens
        bg: '#f8f7f4',
        card: '#ffffff',
        subtle: '#f2f1ee',
        // Border tokens
        line: '#e4e3df',
        'line-strong': '#c8c7c2',
        // Text tokens
        ink: '#1a1916',
        'ink-2': '#6b6a66',
        'ink-3': '#9b9a96',
        // Brand
        accent: '#CAFC02',
        'accent-fg': '#1a1916',
        // Semantic palette
        ok: '#16a34a',
        'ok-bg': '#f0fdf4',
        'ok-border': '#bbf7d0',
        danger: '#dc2626',
        'danger-bg': '#fef2f2',
        'danger-border': '#fecaca',
        warn: '#d97706',
        'warn-bg': '#fffbeb',
        'warn-border': '#fde68a',
        info: '#2563eb',
        'info-bg': '#eff6ff',
        'info-border': '#bfdbfe',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '5px',
        DEFAULT: '8px',
        lg: '12px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,.06)',
        card: '0 2px 8px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)',
        pop: '0 8px 24px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.05)',
      },
      letterSpacing: {
        tightish: '-0.02em',
        wider2: '0.06em',
      },
    },
  },
  plugins: [],
}
