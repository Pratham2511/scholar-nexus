import type { Metadata } from 'next';
import './globals.css';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { PageLoader } from '@/components/ui/page-loader';
import { ResearchBackground } from '@/components/desk/research-background';

export const metadata: Metadata = {
  title: 'KIVO — The Evidence Desk',
  description:
    'A local-first research workbench for discovering scholarly records, tracing citations, capturing source-grounded evidence, and synthesising literature reviews.',
  icons: { icon: '/logo.svg' },
  openGraph: {
    title: 'KIVO — The Evidence Desk',
    description:
      'Discover scholarly records, trace citations, capture source-grounded evidence, and synthesise literature reviews. Local-first. No black boxes.',
    siteName: 'KIVO',
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
      <body className="bg-obsidian text-[var(--text-primary)] antialiased selection:bg-[var(--color-primary)]/30">
        <ResearchBackground />
        <CustomCursor />
        <PageLoader />
        {children}
      </body>
    </html>
  );
}
