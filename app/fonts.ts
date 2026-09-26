import localFont from 'next/font/local';

// The site's two type families. Each one is a CSS variable. The root layout
// sets both variables on <html>, and tailwind.config.ts reads them for
// font-sans, font-neue-montreal, and font-serif.

// Neue Montreal (sans): display, headings, UI, and labels. Every page uses it
// on first paint, so the browser preloads it.
export const neueMontreal = localFont({
  src: [
    { path: '../fonts/PPNeueMontreal-Light.otf', weight: '300', style: 'normal' },
    { path: '../fonts/PPNeueMontreal-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/PPNeueMontreal-Italic.otf', weight: '400', style: 'italic' },
    { path: '../fonts/PPNeueMontreal-Semibold.otf', weight: '600', style: 'normal' },
  ],
  variable: '--font-neue-montreal',
  display: 'swap',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'sans-serif'],
});

// Newsreader (serif): the long-form reading body and its emphasis. A variable
// font with a weight axis from 200 to 800. Only the reading pages use it, so
// the browser does not preload it on every page. The metric-adjusted fallback
// keeps the text from jumping when the file arrives.
export const newsreader = localFont({
  src: [
    { path: '../fonts/Newsreader.woff2', weight: '200 800', style: 'normal' },
    { path: '../fonts/Newsreader-Italic.woff2', weight: '200 800', style: 'italic' },
  ],
  variable: '--font-newsreader',
  display: 'swap',
  preload: false,
  adjustFontFallback: 'Times New Roman',
  fallback: ['Georgia', 'serif'],
});
