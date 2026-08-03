import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScholarAI — AI-Powered Multi-Source Research Paper Discovery",
  description: "Discover high-quality research papers from Semantic Scholar, arXiv, Crossref, and PubMed in one search. AI understands your query, deduplicates, ranks, and summarizes each paper.",
  keywords: ["academic search", "research papers", "AI research assistant", "literature review", "Semantic Scholar", "arXiv", "Crossref", "PubMed"],
  authors: [{ name: "ScholarAI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ScholarAI",
    description: "AI-Powered Multi-Source Research Paper Discovery",
    siteName: "ScholarAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScholarAI",
    description: "AI-Powered Multi-Source Research Paper Discovery",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
