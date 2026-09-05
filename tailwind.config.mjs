/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8F5F0',
        brand: {
          DEFAULT: '#E1AD34',
          50: '#FDF8EC',
          100: '#FAEFD2',
          200: '#F3DDA1',
          300: '#EBC96D',
          400: '#E1AD34',
          500: '#C9962A',
          600: '#A67821',
          700: '#7C591A',
        },
        glass: {
          DEFAULT: '#2D6D8B',
          50: '#F2F7FA',
          100: '#E2EDF3',
          200: '#C2D9E5',
          300: '#8FB6CA',
          400: '#5A8FAB',
          500: '#2D6D8B',
          600: '#27566D',
        },
        ink: {
          DEFAULT: '#1B1A17',
          soft: '#4A4740',
          muted: '#6F6B62',
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        capsule: '0 12px 40px -12px rgba(27, 26, 23, 0.18), 0 2px 8px -2px rgba(27, 26, 23, 0.06)',
        soft: '0 24px 60px -24px rgba(27, 26, 23, 0.28)',
        brand: '0 14px 30px -12px rgba(225, 173, 52, 0.65)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 1s ease both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
