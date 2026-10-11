/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#F5F5F7',
          surface: '#FFFFFF',
          surfaceSecondary: '#FBFBFD',
          text: '#1D1D1F',
          secondaryText: '#6E6E73',
          tertiaryText: '#86868B',
          border: '#E5E5EA',
          borderSubtle: '#F2F2F7',
          blue: '#0071E3',
          blueHover: '#0077ED',
          blueSubtle: '#F0F6FF',
          blueTint: 'rgba(0, 113, 227, 0.08)',
          green: '#34C759',
          greenTint: 'rgba(52, 199, 89, 0.12)',
          amber: '#FF9500',
          amberTint: 'rgba(255, 149, 0, 0.12)',
          red: '#FF3B30',
          redTint: 'rgba(255, 59, 48, 0.12)',
        },
        industrial: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#0071e3',
          700: '#0077ed',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'panel': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'float': '0 8px 24px 0 rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
