import type { AcademicPaper, AIUnderstoodQuery, SearchFilters, SearchResult, SourceResult } from "./types";
import { searchSemanticScholar } from "./sources/semantic-scholar";
import { searchArxiv } from "./sources/arxiv";
import { searchCrossref } from "./sources/crossref";
import { searchCore } from "./sources/core";
import { searchPubmed } from "./sources/pubmed";
import { deduplicatePapers } from "./dedup";
import { applyFilters, rankPapers } from "./rank";

interface OrchestratorOptions {
  /** Per-source result limit */
  perSourceLimit?: number;
  /** Final result limit after ranking */
  finalLimit?: number;
  /** Timeout per source in ms */
  timeoutMs?: number;
  /** Which sources to query */
  sources?: string[];
}

/**
 * Run multi-source academic search in parallel, normalize, dedupe, filter, rank.
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
    sources = ["Semantic Scholar", "arXiv", "Crossref", "PubMed"],
  } = options;

  // Pick the best search term per source — different sources benefit from different query shapes.
  const primaryTerm = understood.searchTerms[0] || understood.topic;

  const tasks: { source: string; fn: () => Promise<AcademicPaper[]> }[] = [];

  if (sources.includes("Semantic Scholar")) {
    tasks.push({
      source: "Semantic Scholar",
      fn: () => withTimeout(searchSemanticScholar(primaryTerm, perSourceLimit), timeoutMs),
    });
  }
  if (sources.includes("arXiv")) {
    tasks.push({
      source: "arXiv",
      fn: () => withTimeout(searchArxiv(primaryTerm, perSourceLimit), timeoutMs),
    });
  }
  if (sources.includes("Crossref")) {
    tasks.push({
      source: "Crossref",
      fn: () => withTimeout(searchCrossref(primaryTerm, perSourceLimit), timeoutMs),
    });
  }
  if (sources.includes("CORE")) {
    tasks.push({
      source: "CORE",
      fn: () => withTimeout(searchCore(primaryTerm, perSourceLimit), timeoutMs).catch(() => [] as AcademicPaper[]),
    });
  }
  if (sources.includes("PubMed")) {
    tasks.push({
      source: "PubMed",
      fn: () => withTimeout(searchPubmed(primaryTerm, perSourceLimit), timeoutMs),
    });
  }

  const sourceStarts = tasks.map((t) => ({
    source: t.source,
    promise: t.fn()
      .then((papers) => ({ source: t.source, papers, success: true as const, durationMs: 0 }))
      .catch((err: unknown) => ({
        source: t.source,
        papers: [] as AcademicPaper[],
        success: false as const,
        error: err instanceof Error ? err.message : String(err),
        durationMs: 0,
      })),
    startedAt: Date.now(),
  }));

  const results = await Promise.all(sourceStarts.map((s) => s.promise.then((r) => ({ ...r, durationMs: Date.now() - s.startedAt }))));

  const sourceResults: SourceResult[] = results.map((r) => ({
    source: r.source,
    papers: r.papers,
    success: r.success,
    error: r.error,
    durationMs: r.durationMs,
  }));

  // Flatten
  const allPapers: AcademicPaper[] = [];
  for (const sr of sourceResults) {
    for (const p of sr.papers) allPapers.push(p);
  }

  // Dedupe
  const { papers: deduped, duplicatesRemoved } = deduplicatePapers(allPapers);

  // Apply filters
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
