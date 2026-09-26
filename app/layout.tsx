import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { themeScript } from '@/lib/theme';
import { getAllSeries, getAllProjects, getAllEssays, getAllDialogues } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Jered Leisey',
  description: "Whatever I'm into, I'm all the way in.",
  icons: {
    icon: [{ url: '/signature.svg', type: 'image/svg+xml' }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allSeries = getAllSeries();
  const allProjects = getAllProjects();
  const allEssays = getAllEssays();
  const allDialogues = getAllDialogues();

  return (
    // The inline theme script changes <html>'s class before hydration.
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full bg-my-cream dark:bg-my-espresso font-neue-montreal flex transition-colors duration-200">
        <ThemeProvider>
          <Sidebar
            allSeries={allSeries}
            allProjects={allProjects}
            allEssays={allEssays}
            allDialogues={allDialogues}
          />
          {/* relative: keeps absolutely positioned children (such as sr-only
              labels) inside main's scroll area, so the whole page never scrolls. */}
          <main className="relative flex-1 overflow-y-auto pt-14 md:pt-0">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
