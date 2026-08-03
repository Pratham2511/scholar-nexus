// Shared types for the academic paper discovery system.

export interface AcademicPaper {
  /** Stable identifier we generate to dedupe across sources. */
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number | null;
  doi: string | null;
  pdfLink: string | null;
  citationCount: number;
  publisher: string | null;
  /** Original source name, e.g. "Semantic Scholar" */
  sources: string[];
  /** All known URLs for this paper across sources */
  sourceUrls: SourceUrl[];
  keywords: string[];
  openAccess: boolean;
  paperType: string | null;
  venue: string | null;
  /** Relevance score (0-100) assigned by the ranking engine */
  relevanceScore?: number;
  /** AI-generated insights, populated on demand */
  aiInsights?: PaperInsights;
}

export interface SourceUrl {
  source: string;
  url: string;
}

export interface PaperInsights {
  summary: string;
  keyContributions: string[];
  advantages: string[];
  limitations: string[];
  futureScope: string[];
  keywords: string[];
}

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  author?: string;
  publisher?: string;
  conference?: string;
  journal?: string;
  domain?: string;
  minCitations?: number;
  openAccessOnly?: boolean;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  paperType?: string;
  methodology?: string;
  language?: string;
}

export interface SearchQuery {
  /** Raw natural-language query from the user. */
  rawQuery: string;
  filters: SearchFilters;
}

export interface AIUnderstoodQuery {
  topic: string;
  intent: string;
  keywords: string[];
  excludeKeywords: string[];
  /** Suggested search terms to send to each source. */
  searchTerms: string[];
  /** Filters extracted or confirmed by the AI. */
  filters: SearchFilters;
  reasoning: string;
}

export interface SourceResult {
  source: string;
  papers: AcademicPaper[];
  success: boolean;
  error?: string;
  durationMs: number;
}

export interface SearchResult {
  papers: AcademicPaper[];
  sources: SourceResult[];
  understoodQuery: AIUnderstoodQuery;
  totalFound: number;
  duplicatesRemoved: number;
  durationMs: number;
}

export const ACADEMIC_SOURCES = [
  "Semantic Scholar",
  "arXiv",
  "Crossref",
  "CORE",
  "PubMed",
] as const;

export type AcademicSourceName = (typeof ACADEMIC_SOURCES)[number];
