import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { neueMontreal, newsreader } from './fonts';
import { FeedPanel } from '@/components/FeedPanel';
import { FeedSheet } from '@/components/FeedSheet';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { getFeed, splitFeed } from '@/lib/content';
import { themeScript } from '@/lib/theme';

const FEED_LENGTH = 12;

export const metadata: Metadata = {
  // Share cards need an absolute URL for app/opengraph-image.png.
  metadataBase: new URL('https://jeredleisey.com'),
  title: 'Jered Leisey',
  description: "Whatever I'm into, I'm all the way in.",
  icons: {
    icon: [{ url: '/signature.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const feed = splitFeed(getFeed({ includeDrafts: process.env.NODE_ENV === 'development', limit: FEED_LENGTH }));

  return (
    // The inline theme script changes <html>'s class before hydration.
    <html
      lang="en"
      className={`h-full ${neueMontreal.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full overflow-hidden bg-my-cream dark:bg-my-espresso font-neue-montreal flex transition-colors duration-200">
        <ThemeProvider>
          <Sidebar />
          {/* relative: keeps absolutely positioned children (such as sr-only
              labels) inside main's scroll area, so the whole page never scrolls. */}
          <main className="relative flex-1 overflow-y-auto pt-14 md:pt-0">
            {children}
          </main>
          {/* The feed survives navigation: a panel from 768px, a sheet on a phone. */}
          <FeedPanel feed={feed} />
          <FeedSheet feed={feed} />
        </ThemeProvider>
        {/* Vercel Web Analytics, with no cookies. Outside a Vercel deployment its script is not served, so it sends nothing. */}
        <Analytics />
      </body>
    </html>
  );
}
