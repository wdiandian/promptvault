import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#ffffff',
          card: '#f8f8f8',
          hover: '#f0f0f0',
          sidebar: '#fafafa',
          input: '#f5f5f5',
          media: '#f2f2f2',
        },
        border: { DEFAULT: '#e5e5e5', hover: '#d0d0d0' },
        text: { DEFAULT: '#1a1a1a', '2': '#666666', '3': '#999999' },
        accent: {
          DEFAULT: '#e8634a',
          hover: '#f07860',
          soft: 'rgba(232,99,74,0.08)',
        },
        green: { DEFAULT: '#16a34a', muted: 'rgba(22,163,74,0.08)' },
        orange: { DEFAULT: '#ea580c', muted: 'rgba(234,88,12,0.08)' },
        red: { DEFAULT: '#dc2626', muted: 'rgba(220,38,38,0.08)' },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        full: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
