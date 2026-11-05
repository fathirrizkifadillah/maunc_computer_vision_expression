/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maunc: {
          yellow: '#FDB813',
          'yellow-light': '#FEE89D',
          'yellow-dark': '#D99800',
          black: '#121316',
          charcoal: '#1E2127',
          'charcoal-light': '#2B303A',
          metal: '#5A6270',
          'metal-light': '#8A92A0',
          bg: '#F5F7FA',
          card: '#FFFFFF',
          border: '#E2E8F0',
          red: '#DC2626'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Cabinet Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -3px rgba(0, 0, 0, 0.08)',
        'glow-yellow': '0 0 20px rgba(253, 184, 19, 0.35)',
      }
    },
  },
  plugins: [],
}
