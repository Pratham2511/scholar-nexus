import { NextRequest, NextResponse } from "next/server";
import { understandQuery } from "@/lib/ai/assistant";
import { searchMultipleSources, DEFAULT_SOURCES } from "@/lib/academic/orchestrator";
import type { SearchFilters } from "@/lib/academic/types";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  rateLimitedResponse,
  readJsonBody,
  truncate,
  MAX_QUERY_LENGTH,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel free tier default is 10s — too short for 9-source parallel search (12s per-source timeout).
// Extend to 60s (max for Hobby tier). Ignored on self-hosted Node servers.
export const maxDuration = 60;

interface SearchRequestBody {
  query: string;
  filters?: SearchFilters;
  sources?: string[];
  limit?: number;
  /** V2 — toggle agentic query expansion (default: true) */
  expandQuery?: boolean;
}

// Search is expensive (AI + 9-27 outbound API calls). Limit aggressively.
const RATE_LIMIT = { max: 20, windowMs: 60_000 }; // 20 searches / minute / IP

/**
 * POST /api/search
 * Body: { query: string, filters?: SearchFilters, sources?: string[], limit?: number, expandQuery?: boolean }
 *
 * Runs the full pipeline:
 *  1. AI query understanding
 *  2. Multi-source parallel search (V2: with agentic query expansion across up to 3 search terms)
 *  3. Normalization (done in adapters)
 *  4. Deduplication
 *  5. Filter application
 *  6. Intelligent ranking
 * Returns ranked papers + per-source diagnostics.
 */
export async function POST(req: NextRequest) {
  // Rate limit check
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  // Body size guard + safe JSON parse
  const bodyResult = await readJsonBody<SearchRequestBody>(req);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  // Validate query
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (query.length === 0) {
    return NextResponse.json({ error: "Missing or invalid 'query' field" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query too long (max ${MAX_QUERY_LENGTH} chars)` },
      { status: 400 },
    );
  }

  try {
    // Sanitize filters — only accept known fields with sane types
    const filters: SearchFilters = {
      yearFrom: sanitizeYear(body.filters?.yearFrom),
      yearTo: sanitizeYear(body.filters?.yearTo),
      author: body.filters?.author ? truncate(body.filters.author, 200) : undefined,
      publisher: body.filters?.publisher ? truncate(body.filters.publisher, 200) : undefined,
      minCitations: sanitizeInt(body.filters?.minCitations, 0, 100_000),
      openAccessOnly: !!body.filters?.openAccessOnly,
      includeKeywords: Array.isArray(body.filters?.includeKeywords)
        ? body.filters!.includeKeywords.slice(0, 20).map((k) => truncate(String(k), 100))
        : [],
      excludeKeywords: Array.isArray(body.filters?.excludeKeywords)
        ? body.filters!.excludeKeywords.slice(0, 20).map((k) => truncate(String(k), 100))
        : [],
      paperType: body.filters?.paperType ? truncate(body.filters.paperType, 100) : undefined,
    };

    // Validate sources list — only accept known source names
    const ALLOWED_SOURCES = new Set<string>([
      "Semantic Scholar", "arXiv", "Crossref", "PubMed", "OpenAlex",
      "IEEE Xplore", "bioRxiv", "medRxiv", "Europe PMC", "CORE",
    ]);
    const sources = Array.isArray(body.sources) && body.sources.length > 0
      ? body.sources.filter((s) => typeof s === "string" && ALLOWED_SOURCES.has(s))
      : [...DEFAULT_SOURCES];
    if (sources.length === 0) sources.push(...DEFAULT_SOURCES);

    const limit = Math.min(Math.max(body.limit || 50, 5), 100);
    const expandQuery = body.expandQuery !== false; // default true

    // Step 1: AI query understanding
    const understood = await understandQuery(query, filters);

    // Step 2-6: Multi-source search + dedupe + filter + rank
    const result = await searchMultipleSources(understood, {
      finalLimit: limit,
      sources,
      expandQuery,
    });

    // Persist search history in the background (fire-and-forget, no await)
    void persistSearchHistory(query, filters, result.totalFound).catch((e) => {
      console.error("[search] failed to persist history:", e);
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[search] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sanitizeYear(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const y = Math.floor(v);
  if (y < 1900 || y > 2100) return undefined;
  return y;
}

function sanitizeInt(v: unknown, min: number, max: number): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return Math.min(Math.max(Math.floor(v), min), max);
}

async function persistSearchHistory(query: string, filters: SearchFilters, resultCount: number) {
  await ensureLocalUser();
  await db.searchHistory.create({
    data: {
      userId: getLocalUserId(),
      query,
      filters: JSON.stringify(filters),
      resultCount,
    },
  });
}
