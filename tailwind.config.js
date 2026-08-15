/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Clinical-specific colors
        'clinical': {
          'blue': '#0052CC',
          'blue-light': '#E3F2FD',
          'blue-dark': '#003399',
        },
        'risk': {
          'red': '#DC2626',
          'red-light': '#FEE2E2',
          'red-dark': '#991B1B',
          'amber': '#F59E0B',
          'amber-light': '#FEF3C7',
          'amber-dark': '#B45309',
          'teal': '#14B8A6',
          'teal-light': '#CCFBF1',
          'teal-dark': '#0D7377',
        },
        'status': {
          'high': '#DC2626',
          'moderate': '#F59E0B',
          'low': '#14B8A6',
          'normal': '#10B981',
        },
        'neutral': {
          '50': '#F9FAFB',
          '100': '#F3F4F6',
          '200': '#E5E7EB',
          '300': '#D1D5DB',
          '400': '#9CA3AF',
          '500': '#6B7280',
          '600': '#4B5563',
          '700': '#374151',
          '800': '#1F2937',
          '900': '#111827',
        },
      },
      spacing: {
        '14': '3.5rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      fontFamily: {
        'sans': [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        'mono': [
          'Menlo',
          'Monaco',
          '"Courier New"',
          'monospace',
        ],
      },
      fontWeight: {
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      borderRadius: {
        'sm': '0.25rem',
        'base': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'clinical': '0 4px 12px rgba(0, 82, 204, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
        'standard': 'all',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        'auto': 'auto',
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        'modal': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'popover': '1060',
        'tooltip': '1070',
      },
      opacity: {
        '0': '0',
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
        '25': '0.25',
        '30': '0.3',
        '40': '0.4',
        '50': '0.5',
        '60': '0.6',
        '70': '0.7',
        '75': '0.75',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
        '100': '1',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'base': '8px',
        'md': '12px',
        'lg': '16px',
      },
    },
  },
  plugins: [
    // Custom plugin for clinical-specific utilities
    function ({ addComponents, theme }) {
      const components = {
        '.btn-primary': {
          '@apply px-4 py-2 rounded-lg font-medium bg-clinical-blue text-white hover:bg-clinical-blue-dark transition-colors': {},
        },
        '.btn-secondary': {
          '@apply px-4 py-2 rounded-lg font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors': {},
        },
        '.btn-danger': {
          '@apply px-4 py-2 rounded-lg font-medium bg-risk-red text-white hover:bg-risk-red-dark transition-colors': {},
        },
        '.card': {
          '@apply bg-white rounded-lg border border-neutral-200 shadow-sm': {},
        },
        '.card-hover': {
          '@apply card hover:shadow-md hover:border-clinical-blue transition-all': {},
        },
        '.badge-high': {
          '@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-risk-red-light text-risk-red': {},
        },
        '.badge-moderate': {
          '@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-risk-amber-light text-risk-amber': {},
        },
        '.badge-low': {
          '@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-risk-teal-light text-risk-teal': {},
        },
        '.input-field': {
          '@apply w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-clinical-blue focus:border-transparent transition-all': {},
        },
        '.input-error': {
          '@apply border-risk-red focus:ring-risk-red': {},
        },
        '.label': {
          '@apply block text-sm font-medium text-neutral-700 mb-1': {},
        },
        '.text-error': {
          '@apply text-risk-red text-sm mt-1': {},
        },
        '.text-muted': {
          '@apply text-neutral-600 text-sm': {},
        },
        '.divider': {
          '@apply border-t border-neutral-200': {},
        },
        '.section-header': {
          '@apply text-2xl font-bold text-neutral-900 mb-6': {},
        },
        '.subsection-header': {
          '@apply text-lg font-semibold text-neutral-900 mb-4': {},
        },
      };
      addComponents(components);
    },
  ],
  safelist: [
    // Safelist for dynamic classes that may not be detected
    {
      pattern: /^(bg|text|border|shadow)-(clinical|risk|status|neutral)-(blue|red|amber|teal)(-light|-dark)?$/,
    },
  ],
  corePlugins: {},
  variants: {
    extend: {},
  },
}
