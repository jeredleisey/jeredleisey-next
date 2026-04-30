import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        my: {
          cream: '#F4EFE6',
          parchment: '#EAE3D6',
          stone: '#C2B8A8',
          amber: '#CC922F',
          espresso: '#1C1714',
          orange: '#FF4F00',
        },
      },
      fontFamily: {
        'neue-montreal': ['Neue-Montreal', 'sans-serif'],
      },
      spacing: {
        'pad-2': 'max(20px, 4vmin)',
        'pad-4': 'max(40px, 8vmin)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
