/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        anilyfe: {
          50: '#F6FCFF',
          100: '#E7F1FF',
          200: '#D0E3FF',
          300: '#9FB8EE',
          400: '#708BD1',
          500: '#334EAC',
          600: '#233D92',
          700: '#081F5C',
          800: '#071B52',
          900: '#041338'
        },
        success: '#1F9D55',
        warning: '#B7791F',
        error: '#B42318',
        info: '#2563EB'
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        tech: ['Chakra Petch', 'sans-serif']
      },
      borderRadius: { anilyfe: '16px' },
      boxShadow: {
        card: '0 10px 30px -18px rgba(8,31,92,.25)',
        lift: '0 24px 48px -20px rgba(8,31,92,.35)',
        glow: '0 0 60px rgba(127,176,255,.35)'
      },
      keyframes: {
        'anilyfe-404-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      animation: {
        'anilyfe-404-float': 'anilyfe-404-float 4.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
