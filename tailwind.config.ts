import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        my: {
          cream: '#F4EFE6',
          parchment: '#EAE3D6',
          stone: '#C2B8A8',
          walnut: '#7A6E64',
          amber: '#CC922F',
          espresso: '#1C1714',
          orange: '#FF4F00',
        },
      },
      fontFamily: {
        // The variables come from app/fonts.ts (next/font/local). Each one
        // already holds its own fallback stack. The names after it apply only
        // when the variable is not set.
        'neue-montreal': ['var(--font-neue-montreal)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-neue-montreal)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
      },
      spacing: {
        'pad-2': 'max(20px, 4vmin)',
        'pad-4': 'max(40px, 8vmin)',
      },
      typography: {
        DEFAULT: {
          css: {
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
          },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
