import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
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
    <html lang="en" className="h-full">
      <body className="h-full bg-my-cream dark:bg-my-espresso font-neue-montreal flex transition-colors duration-200">
        <ThemeProvider>
          <Sidebar
            allSeries={allSeries}
            allProjects={allProjects}
            allEssays={allEssays}
            allDialogues={allDialogues}
          />
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
