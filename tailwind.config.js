/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ChopChop brand palette (Phase 1 build brief §8)
        navy: {
          DEFAULT: '#1B2A4A',
          50: '#EEF1F7',
          100: '#D6DDEC',
          700: '#243761',
          900: '#131F38',
        },
        brand: {
          orange: '#E8590C',
          'orange-dark': '#C8480A',
        },
        ready: '#2E9E5B',
        warn: '#F2A93B',
        offwhite: '#FAFAF8',
        charcoal: {
          DEFAULT: '#1A1A1D',
          light: '#26262B',
          border: '#3A3A42',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.9)' },
          '60%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.22s ease-out',
        'pop': 'pop 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
