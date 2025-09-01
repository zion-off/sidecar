/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        xxs: '0.675rem'
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 6px 2px rgba(255,255,255,0.10), 0 0 14px 4px rgba(255,255,255,0.06)'
          },
          '50%': {
            boxShadow: '0 0 10px 3px rgba(255,255,255,0.18), 0 0 22px 6px rgba(255,255,255,0.10)'
          }
        }
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite'
      },
      colors: {
        'lc-primary': 'hsl(var(--lc-primary))',
        'lc-fg': 'hsl(var(--lc-fg))',
        'lc-layer-one': 'hsl(var(--lc-layer-one))',
        'lc-textarea-bg': 'hsl(var(--lc-textarea-bg))',
        'lc-bg-base': 'hsl(var(--lc-bg-base))',
        'table-heading': 'var(--table-heading)',
        'pill-border': 'var(--pill-border)',
        'lc-text-body': 'hsl(var(--lc-text-body))',
        'lc-text-secondary': 'hsl(var(--lc-text-secondary))',
        'lc-bg-popover': 'hsl(var(--lc-bg-popover))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))'
        }
      },
      borderRadius: {
        'lc-mini': '21px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
