import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Accent (amber) — dono themes mein same
        accent: {
          DEFAULT: '#F5A623',
          soft: '#FDF0D5',   // light mode badges/pills
          dim: '#B87A0E',    // light mode text-accent
        },
        // Navy — dark theme shades
        navy: {
          DEFAULT: '#0A1929',   // page bg (dark)
          light: '#112240',     // cards (dark)
          lighter: '#1B3A5C',   // inputs/hover (dark)
          border: '#23405E',    // borders (dark)
        },
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37,211,102,0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(37,211,102,0)' },
        },
        sweepLight: {
          '0%': { left: '-100%', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { left: '200%', opacity: '0' },
        },
        floatGear: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(180deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite',
        'sweep-light': 'sweepLight 3s infinite',
        'float-gear': 'floatGear 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config