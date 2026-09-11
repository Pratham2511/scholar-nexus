import type { Metadata } from 'next';
import './globals.css';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { PageLoader } from '@/components/ui/page-loader';
import { ResearchBackground } from '@/components/desk/research-background';

export const metadata: Metadata = {
  title: 'ScholarNexus — Literature Discovery & Systematic Synthesis',
  description:
    'Multi-repository scholarly research workbench with citation intelligence, evidence extraction, and systematic review tools.',
  icons: { icon: '/logo.svg' },
  openGraph: {
    title: 'ScholarNexus — Literature Discovery & Systematic Synthesis',
    description:
      'Multi-repository scholarly research workbench with citation intelligence, evidence extraction, and systematic review tools.',
    siteName: 'ScholarNexus',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-obsidian text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-100">
        <ResearchBackground />
        <CustomCursor />
        <PageLoader />
        {children}
      </body>
    </html>
  );
}
