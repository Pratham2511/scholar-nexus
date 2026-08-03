import type { AcademicPaper, SourceUrl } from "./types";
import { titleKey, normalizeText } from "./utils";

/**
 * Remove duplicate papers across sources by merging on DOI then title similarity.
 * When two records refer to the same paper, we merge their metadata, sources,
 * source URLs, and keep the richest field values.
 */
export function deduplicatePapers(papers: AcademicPaper[]): {
  papers: AcademicPaper[];
  duplicatesRemoved: number;
} {
  const byDoi = new Map<string, AcademicPaper>();
  const byTitle = new Map<string, AcademicPaper>();
  const merged: AcademicPaper[] = [];

  for (const paper of papers) {
    // Try DOI match first
    if (paper.doi) {
      const doiKey = paper.doi.toLowerCase().trim();
      const existing = byDoi.get(doiKey);
      if (existing) {
        mergeInto(existing, paper);
        continue;
      }
      byDoi.set(doiKey, paper);
    }

    // Try title match
    const tKey = titleKey(paper.title);
    if (tKey.length > 10) {
      const existing = byTitle.get(tKey);
      if (existing) {
        mergeInto(existing, paper);
        // Also register by DOI if we now have one
        if (paper.doi && !byDoi.has(paper.doi.toLowerCase().trim())) {
          byDoi.set(paper.doi.toLowerCase().trim(), existing);
        }
        continue;
      }
      byTitle.set(tKey, paper);
    }

    merged.push(paper);
  }

  // Reassign clean ids after merging
  for (const p of merged) {
    if (!p.id || p.id.startsWith("merged-")) {
      p.id = p.doi || p.title.slice(0, 60).toLowerCase().replace(/\s+/g, "-");
    }
  }

  const duplicatesRemoved = papers.length - merged.length;
  return { papers: merged, duplicatesRemoved };
}

function mergeInto(target: AcademicPaper, source: AcademicPaper): void {
  // Union sources
  const sourceSet = new Set(target.sources);
  for (const s of source.sources) sourceSet.add(s);
  target.sources = [...sourceSet];

  // Union source URLs (deduped by url)
  const urlMap = new Map<string, SourceUrl>();
  for (const su of [...target.sourceUrls, ...source.sourceUrls]) {
    if (su.url) urlMap.set(su.url, su);
  }
  target.sourceUrls = [...urlMap.values()];

  // Prefer longer abstract
  if (source.abstract.length > target.abstract.length) {
    target.abstract = source.abstract;
  }

  // Prefer larger citation count
  if (source.citationCount > target.citationCount) {
    target.citationCount = source.citationCount;
  }

  // Fill missing fields
  if (!target.doi && source.doi) target.doi = source.doi;
  if (!target.pdfLink && source.pdfLink) target.pdfLink = source.pdfLink;
  if (!target.year && source.year) target.year = source.year;
  if (!target.publisher && source.publisher) target.publisher = source.publisher;
  if (!target.venue && source.venue) target.venue = source.venue;
  if (!target.paperType && source.paperType) target.paperType = source.paperType;
  if (!target.openAccess) target.openAccess = source.openAccess;

  // Union authors (deduped by name)
  const authorSet = new Set(target.authors.map((a) => normalizeText(a)));
  for (const a of source.authors) {
    const n = normalizeText(a);
    if (n && !authorSet.has(n)) {
      authorSet.add(n);
      target.authors.push(a);
    }
  }

  // Union keywords
  const kwSet = new Set(target.keywords.map((k) => k.toLowerCase()));
  for (const k of source.keywords) {
    const kl = k.toLowerCase();
    if (!kwSet.has(kl)) {
      kwSet.add(kl);
      target.keywords.push(kl);
    }
  }
}
