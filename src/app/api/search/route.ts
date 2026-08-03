import { NextRequest, NextResponse } from "next/server";
import { understandQuery } from "@/lib/ai/assistant";
import { searchMultipleSources } from "@/lib/academic/orchestrator";
import type { SearchFilters } from "@/lib/academic/types";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SearchRequestBody {
  query: string;
  filters?: SearchFilters;
  sources?: string[];
  limit?: number;
}

/**
 * POST /api/search
 * Body: { query: string, filters?: SearchFilters, sources?: string[], limit?: number }
 *
 * Runs the full pipeline:
 *  1. AI query understanding
 *  2. Multi-source parallel search
 *  3. Normalization (done in adapters)
 *  4. Deduplication
 *  5. Filter application
 *  6. Intelligent ranking
 * Returns ranked papers + per-source diagnostics.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SearchRequestBody;
    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid 'query' field" }, { status: 400 });
    }

    const filters = body.filters || {};
    const sources = body.sources && body.sources.length > 0
      ? body.sources
      : ["Semantic Scholar", "arXiv", "Crossref", "PubMed"];
    const limit = Math.min(Math.max(body.limit || 50, 5), 100);

    // Step 1: AI query understanding
    const understood = await understandQuery(body.query, filters);

    // Step 2-6: Multi-source search + dedupe + filter + rank
    const result = await searchMultipleSources(understood, {
      finalLimit: limit,
      sources,
    });

    // Persist search history in the background (fire-and-forget, no await)
    void persistSearchHistory(body.query, filters, result.totalFound).catch((e) => {
      console.error("[search] failed to persist history:", e);
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[search] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
