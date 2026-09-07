import type { Config } from 'tailwindcss';

// Palet disalin dari packages/design-tokens/tokens.json (vendored — jangan import workspace).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1917',
        cream: '#FAF7F2',
        paper: '#FFFFFF',
        gold: '#B45309',
        goldsoft: '#F5E6C8',
        leaf: '#3F6212',
        clay: '#9A3412',
        line: '#E7E0D4',
        muted: '#78716C',
        danger: '#B91C1C',
        warning: '#B45309',
        success: '#15803D',
        night: '#141210',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
};

export default config;
