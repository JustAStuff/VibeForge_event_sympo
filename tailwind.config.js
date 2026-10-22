/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VibeForge Dark Theme
        'vf-bg': '#0a0a0f',
        'vf-surface': '#111118',
        'vf-surface-2': '#1a1a2e',
        'vf-surface-3': '#1e1e3a',
        'vf-border': '#2a2a4a',
        'vf-border-2': '#3a3a5a',
        // Accents
        'vf-violet': '#7c3aed',
        'vf-violet-light': '#9f6ef7',
        'vf-violet-dim': '#4c1d95',
        'vf-cyan': '#06b6d4',
        'vf-cyan-light': '#22d3ee',
        'vf-orange': '#f97316',
        'vf-orange-light': '#fb923c',
        // Text
        'vf-text': '#f1f5f9',
        'vf-text-2': '#cbd5e1',
        'vf-text-muted': '#64748b',
        // Status
        'vf-success': '#22c55e',
        'vf-warning': '#f59e0b',
        'vf-error': '#ef4444',
        'vf-info': '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(124, 58, 237, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.7)' },
        },
      },
      boxShadow: {
        'vf': '0 4px 24px rgba(124, 58, 237, 0.15)',
        'vf-sm': '0 2px 8px rgba(124, 58, 237, 0.1)',
        'vf-lg': '0 8px 40px rgba(124, 58, 237, 0.25)',
      },
    },
  },
  plugins: [],
}
