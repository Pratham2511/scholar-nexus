import type { AcademicPaper, AIUnderstoodQuery, SearchFilters, SearchResult, SourceResult } from "./types";
import { searchSemanticScholar } from "./sources/semantic-scholar";
import { searchArxiv } from "./sources/arxiv";
import { searchCrossref } from "./sources/crossref";
import { searchCore } from "./sources/core";
import { searchPubmed } from "./sources/pubmed";
import { searchOpenAlex } from "./sources/openalex";
import { searchIEEE } from "./sources/ieee";
import { searchBiorxiv } from "./sources/biorxiv";
import { searchEuropePMC } from "./sources/europepmc";
import { deduplicatePapers } from "./dedup";
import { applyFilters, rankPapers } from "./rank";

/**
 * Default enabled sources for V2.
 * CORE is intentionally omitted from defaults (too unreliable without an API key)
 * but remains available as an opt-in source.
 */
export const DEFAULT_SOURCES = [
  "Semantic Scholar",
  "arXiv",
  "Crossref",
  "PubMed",
  "OpenAlex",
  "IEEE Xplore",
  "bioRxiv",
  "medRxiv",
  "Europe PMC",
] as const;

interface OrchestratorOptions {
  /** Per-source result limit */
  perSourceLimit?: number;
  /** Final result limit after ranking */
  finalLimit?: number;
  /** Timeout per source in ms */
  timeoutMs?: number;
  /** Which sources to query */
  sources?: string[];
  /**
   * V2 — Agentic Query Expansion.
   * If true, the orchestrator runs up to 3 search variants (using the LLM's
   * searchTerms array) in parallel per source and merges results before dedup.
   * This catches papers a single query would miss.
   */
  expandQuery?: boolean;
}

/**
 * Run multi-source academic search in parallel, normalize, dedupe, filter, rank.
 *
 * V2: If `expandQuery` is true (default), runs up to 3 search-term variants per source
 * concurrently and merges the results before deduplication. This significantly improves
 * recall for ambiguous queries.
 */
export async function searchMultipleSources(
  understood: AIUnderstoodQuery,
  options: OrchestratorOptions = {},
): Promise<SearchResult> {
  const startTime = Date.now();
  const {
    perSourceLimit = 25,
    finalLimit = 50,
    timeoutMs = 12000,
    sources = [...DEFAULT_SOURCES],
    expandQuery = true,
  } = options;

  // V2: Build the list of search terms to try. Always include the primary term.
  // The LLM returns up to 3 searchTerms in the AIUnderstoodQuery.
  const searchTerms = expandQuery && understood.searchTerms.length > 1
    ? understood.searchTerms.slice(0, 3)
    : [understood.searchTerms[0] || understood.topic];

  // Build all (source × searchTerm) tasks
  const tasks: { source: string; searchTerm: string; fn: () => Promise<AcademicPaper[]> }[] = [];
  for (const term of searchTerms) {
    if (sources.includes("Semantic Scholar")) {
      tasks.push({ source: "Semantic Scholar", searchTerm: term, fn: () => withTimeout(searchSemanticScholar(term, perSourceLimit), timeoutMs) });
    }
    if (sources.includes("arXiv")) {
      tasks.push({ source: "arXiv", searchTerm: term, fn: () => withTimeout(searchArxiv(term, perSourceLimit), timeoutMs) });
    }
    if (sources.includes("Crossref")) {
      tasks.push({ source: "Crossref", searchTerm: term, fn: () => withTimeout(searchCrossref(term, perSourceLimit), timeoutMs) });
    }
    if (sources.includes("PubMed")) {
      tasks.push({ source: "PubMed", searchTerm: term, fn: () => withTimeout(searchPubmed(term, perSourceLimit), timeoutMs) });
    }
    if (sources.includes("OpenAlex")) {
      tasks.push({ source: "OpenAlex", searchTerm: term, fn: () => withTimeout(searchOpenAlex(term, perSourceLimit), timeoutMs) });
    }
    if (sources.includes("IEEE Xplore")) {
      tasks.push({ source: "IEEE Xplore", searchTerm: term, fn: () => withTimeout(searchIEEE(term, perSourceLimit), timeoutMs).catch(() => [] as AcademicPaper[]) });
    }
    if (sources.includes("bioRxiv") || sources.includes("medRxiv")) {
      // biorxiv adapter queries both servers; we only need to call it once per term.
      tasks.push({ source: "bioRxiv", searchTerm: term, fn: () => withTimeout(searchBiorxiv(term, perSourceLimit), timeoutMs).catch(() => [] as AcademicPaper[]) });
    }
    if (sources.includes("Europe PMC")) {
      tasks.push({ source: "Europe PMC", searchTerm: term, fn: () => withTimeout(searchEuropePMC(term, perSourceLimit), timeoutMs).catch(() => [] as AcademicPaper[]) });
    }
    if (sources.includes("CORE")) {
      tasks.push({ source: "CORE", searchTerm: term, fn: () => withTimeout(searchCore(term, perSourceLimit), timeoutMs).catch(() => [] as AcademicPaper[]) });
    }
  }

  // Fan out all (source × term) requests concurrently
  const taskStarts = tasks.map((t) => ({
    source: t.source,
    promise: t.fn()
      .then((papers) => ({ source: t.source, papers, success: true as const, error: undefined as string | undefined }))
      .catch((err: unknown) => ({
        source: t.source,
        papers: [] as AcademicPaper[],
        success: false as const,
        error: err instanceof Error ? err.message : String(err),
      })),
    startedAt: Date.now(),
  }));

  const results = await Promise.all(
    taskStarts.map((s) => s.promise.then((r) => ({ ...r, durationMs: Date.now() - s.startedAt }))),
  );

  // Aggregate per-source: union of papers across all search terms, deduped by source
  const sourceMap = new Map<string, { papers: AcademicPaper[]; success: boolean; error?: string; durationMs: number }>();
  for (const r of results) {
    const existing = sourceMap.get(r.source);
    if (!existing) {
      sourceMap.set(r.source, {
        papers: r.papers,
        success: r.success,
        error: r.error,
        durationMs: r.durationMs,
      });
    } else {
      // Merge papers (dedupe within source by id)
      const seen = new Set(existing.papers.map((p) => p.id));
      for (const p of r.papers) {
        if (!seen.has(p.id)) {
          existing.papers.push(p);
          seen.add(p.id);
        }
      }
      // Source is successful if any of its variants succeeded
      if (r.success) existing.success = true;
      // Keep the first non-empty error if any
      if (!existing.error && r.error) existing.error = r.error;
      existing.durationMs = Math.max(existing.durationMs, r.durationMs);
    }
  }

  const sourceResults: SourceResult[] = [...sourceMap.entries()].map(([source, val]) => ({
    source,
    papers: val.papers,
    success: val.success,
    error: val.error,
    durationMs: val.durationMs,
  }));

  // Flatten all papers from all sources
  const allPapers: AcademicPaper[] = [];
  for (const sr of sourceResults) {
    for (const p of sr.papers) allPapers.push(p);
  }

  // Dedupe across sources (DOI + title merge)
  const { papers: deduped, duplicatesRemoved } = deduplicatePapers(allPapers);

  // Apply user filters
  const filtered = applyFilters(deduped, understood.filters);

  // Rank
  const ranked = rankPapers(filtered, understood);

  // Final cap
  const final = ranked.slice(0, finalLimit);

  return {
    papers: final,
    sources: sourceResults,
    understoodQuery: understood,
    totalFound: final.length,
    duplicatesRemoved,
    durationMs: Date.now() - startTime,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
