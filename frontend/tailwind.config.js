/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          green:  '#00ff88',
          red:    '#ff3366',
          amber:  '#ffaa00',
          blue:   '#00aaff',
          purple: '#aa44ff',
        },
        dark: {
          900: '#050812',
          800: '#0a1020',
          700: '#0f1830',
          600: '#162040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'siren': 'siren 0.5s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.4s ease-out',
      },
      keyframes: {
        siren: {
          '0%':   { opacity: '1', boxShadow: '0 0 20px #ff3366' },
          '100%': { opacity: '0.5', boxShadow: '0 0 40px #ff3366' },
        },
        slideIn: {
          '0%':   { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'neon-green':  '0 0 15px #00ff88, 0 0 30px #00ff8855',
        'neon-red':    '0 0 15px #ff3366, 0 0 30px #ff336655',
        'neon-amber':  '0 0 15px #ffaa00, 0 0 30px #ffaa0055',
        'neon-blue':   '0 0 15px #00aaff, 0 0 30px #00aaff55',
        'glass':       '0 4px 30px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
