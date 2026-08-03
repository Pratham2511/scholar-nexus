"use client";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-center text-sm text-muted-foreground">
        <p>
          ScholarAI — AI-Powered Multi-Source Research Paper Discovery
        </p>
        <p className="mt-1 text-xs">
          Searches Semantic Scholar, arXiv, Crossref &amp; PubMed in parallel ·
          Built with Next.js, Prisma, and the Z.ai LLM SDK
        </p>
      </div>
    </footer>
  );
}
