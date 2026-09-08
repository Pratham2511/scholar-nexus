import type { Metadata } from 'next';
import { Newsreader, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { PageLoader } from '@/components/ui/page-loader';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ScholarNexus — The Evidence Desk',
  description:
    'Search academic sources, organize a literature review, and trace findings to their supporting passages.',
  icons: { icon: '/logo.svg' },
  openGraph: {
    title: 'ScholarNexus — The Evidence Desk',
    description: 'A personal workspace for source-linked research.',
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
    <html
      lang="en"
      className={`${newsreader.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body>
        <CustomCursor />
        <PageLoader />
        {children}
      </body>
    </html>
  );
}

