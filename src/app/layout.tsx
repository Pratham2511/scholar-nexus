import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { AmbientBackground } from '@/components/ui/ambient-background';
import { PageLoader } from '@/components/ui/page-loader';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
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
      className={`${cormorantGaramond.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <CustomCursor />
        <AmbientBackground />
        <PageLoader />
        {children}
      </body>
    </html>
  );
}
