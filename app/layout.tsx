import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { getAllSeries, getAllProjects, getAllEssays } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Jered Leisey',
  description: "Whatever I'm into, I'm all the way in.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allSeries = getAllSeries();
  const allProjects = getAllProjects();
  const allEssays = getAllEssays();

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-my-espresso font-neue-montreal flex">
        <Sidebar
          allSeries={allSeries}
          allProjects={allProjects}
          allEssays={allEssays}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
