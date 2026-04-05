/** @type {import('tailwindcss').Config} */
function createOpacityScale(hex) {
  const result = { DEFAULT: hex }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  ;[5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100].forEach(op => {
    result[op] = `rgba(${r}, ${g}, ${b}, ${op / 100})`
  })
  return result
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-black': createOpacityScale('#000000'),
        'space-gray': '#0a0a0a',
        'space-blue': createOpacityScale('#0b1021'),
        'charcoal': '#1a1a1a',
        'light-charcoal': '#2a2a2a',
        'accent-blue': createOpacityScale('#0055ff'),
        'accent-cyan': createOpacityScale('#00d4ff'),
        'accent-white': '#ffffff',
        'accent-green': createOpacityScale('#00ff88'),
        'accent-orange': createOpacityScale('#ff6b00'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 85, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 85, 255, 0.8), 0 0 40px rgba(0, 212, 255, 0.4)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
