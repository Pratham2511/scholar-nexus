import type { AcademicPaper, AIUnderstoodQuery, SearchFilters } from "./types";
import { titleKey } from "./utils";

/**
 * Apply user-defined filters (year, citations, open access, keywords, etc.)
 * BEFORE ranking. Papers that don't satisfy hard constraints are removed.
 */
export function applyFilters(papers: AcademicPaper[], filters: SearchFilters): AcademicPaper[] {
  return papers.filter((p) => {
    if (filters.yearFrom && (p.year === null || p.year < filters.yearFrom)) return false;
    if (filters.yearTo && (p.year === null || p.year > filters.yearTo)) return false;
    if (filters.minCitations && p.citationCount < filters.minCitations) return false;
    if (filters.openAccessOnly && !p.openAccess) return false;
    if (filters.author) {
      const want = filters.author.toLowerCase();
      if (!p.authors.some((a) => a.toLowerCase().includes(want))) return false;
    }
    if (filters.publisher) {
      const want = filters.publisher.toLowerCase();
      const pub = (p.publisher || p.venue || "").toLowerCase();
      if (!pub.includes(want)) return false;
    }
    if (filters.conference || filters.journal) {
      const want = (filters.conference || filters.journal || "").toLowerCase();
      const venue = (p.venue || p.publisher || "").toLowerCase();
      if (!venue.includes(want)) return false;
    }
    if (filters.paperType && filters.paperType !== "any") {
      const want = filters.paperType.toLowerCase();
      const pt = (p.paperType || "").toLowerCase();
      // Exclude logic: if user said "exclude review", we drop review papers
      if (filters.paperType.startsWith("exclude:")) {
        const excl = filters.paperType.slice(8).toLowerCase();
        if (pt.includes(excl)) return false;
      } else if (!pt.includes(want)) {
        return false;
      }
    }
    if (filters.includeKeywords && filters.includeKeywords.length > 0) {
      const text = (p.title + " " + p.abstract + " " + p.keywords.join(" ")).toLowerCase();
      const hasAll = filters.includeKeywords.every((k) => text.includes(k.toLowerCase()));
      if (!hasAll) return false;
    }
    if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
      const text = (p.title + " " + p.abstract + " " + p.keywords.join(" ")).toLowerCase();
      const hasAny = filters.excludeKeywords.some((k) => text.includes(k.toLowerCase()));
      if (hasAny) return false;
    }
    return true;
  });
}

/**
 * Score each paper 0-100 based on relevance, citations, recency, source quality,
 * and open-access availability.
 */
export function rankPapers(
  papers: AcademicPaper[],
  understood: AIUnderstoodQuery,
): AcademicPaper[] {
  const queryKeywords = understood.keywords.map((k) => k.toLowerCase());
  const excludeKeywords = understood.excludeKeywords.map((k) => k.toLowerCase());
  const topicKey = titleKey(understood.topic);

  const currentYear = new Date().getFullYear();

  const scored = papers.map((p) => {
    const score = scorePaper(p, queryKeywords, excludeKeywords, topicKey, currentYear);
    return { paper: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => ({ ...s.paper, relevanceScore: Math.round(s.score) }));
}

function scorePaper(
  p: AcademicPaper,
  queryKeywords: string[],
  excludeKeywords: string[],
  topicKey: string,
  currentYear: number,
): number {
  let score = 0;

  // Semantic relevance (40 points max)
  const titleL = p.title.toLowerCase();
  const abstractL = p.abstract.toLowerCase();
  const keywordsL = p.keywords.map((k) => k.toLowerCase());

  // Title match with topic words
  const topicWords = topicKey.split(" ").filter((w) => w.length > 3);
  const titleTopicHits = topicWords.filter((w) => titleL.includes(w)).length;
  score += Math.min(15, titleTopicHits * 5);

  // Keyword coverage
  const kwHits = queryKeywords.filter((k) => {
    return titleL.includes(k) || keywordsL.includes(k) || abstractL.includes(k);
  }).length;
  score += Math.min(15, kwHits * 3);

  // Title keyword density (more keywords from query in title = more relevant)
  if (queryKeywords.length > 0) {
    const titleKwHits = queryKeywords.filter((k) => titleL.includes(k)).length;
    score += Math.min(10, titleKwHits * 4);
  }

  // Exclude keywords penalty (heavy)
  const exclHits = excludeKeywords.filter((k) => titleL.includes(k) || abstractL.includes(k)).length;
  score -= exclHits * 10;

  // Citation impact (25 points max, log scale)
  if (p.citationCount > 0) {
    const citationScore = Math.min(25, Math.log10(p.citationCount + 1) * 10);
    score += citationScore;
  }

  // Recency (15 points max) — newer = better, but don't over-penalize classics
  if (p.year) {
    const age = currentYear - p.year;
    if (age <= 1) score += 15;
    else if (age <= 3) score += 12;
    else if (age <= 5) score += 8;
    else if (age <= 10) score += 4;
    else score += 1;
  }

  // Source quality / publisher reputation (10 points max)
  const venueL = (p.publisher || p.venue || "").toLowerCase();
  const reputable = ["nature", "science", "ieee", "acm", "springer", "elsevier", "wiley", "cell", "lancet", "nejm", "pnas"];
  if (reputable.some((r) => venueL.includes(r))) score += 10;
  else if (venueL) score += 3;

  // Open access bonus (5 points)
  if (p.openAccess) score += 5;

  // Multi-source discovery bonus (5 points) — paper exists on multiple sources = high quality
  if (p.sources.length >= 3) score += 5;
  else if (p.sources.length === 2) score += 2;

  return Math.max(0, Math.min(100, score));
}
