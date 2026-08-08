import { NextRequest, NextResponse } from "next/server";
import { synthesizeEvidence } from "@/lib/ai/assistant";
import type { AcademicPaper } from "@/lib/academic/types";
import {
  checkRateLimit,
  rateLimitedResponse,
  readJsonBody,
  truncate,
  MAX_TITLE_LENGTH,
  MAX_ABSTRACT_LENGTH,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SynthesizeRequestBody {
  papers: AcademicPaper[];
  query: string;
}

const RATE_LIMIT = { max: 15, windowMs: 60_000 }; // 15 / min / IP — synthesis is expensive
const MAX_PAPERS = 20;

/**
 * POST /api/ai/synthesize
 * Generates an AI evidence synthesis across multiple papers from a search.
 * Returns: { synthesis: EvidenceSynthesis }
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<SynthesizeRequestBody>(req, 1024 * 1024); // 1 MB
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!Array.isArray(body.papers)) {
    return NextResponse.json({ error: "Missing or invalid 'papers' field" }, { status: 400 });
  }
  if (body.papers.length === 0) {
    return NextResponse.json({
      synthesis: {
        summary: "No papers found for this query yet.",
        consensus: "",
        contradictions: "",
        researchGaps: [],
        methodologies: [],
        keyFindings: [],
        suggestedQueries: [],
      },
    });
  }

  // Sanitize and cap paper inputs
  const sanitizedPapers: AcademicPaper[] = body.papers.slice(0, MAX_PAPERS).map((p) => ({
    ...p,
    title: truncate(p.title || "", MAX_TITLE_LENGTH),
    abstract: truncate(p.abstract || "", MAX_ABSTRACT_LENGTH),
  }));
  const query = truncate(body.query || "", 1000);

  try {
    const synthesis = await synthesizeEvidence(sanitizedPapers, query);
    return NextResponse.json({ synthesis });
  } catch (err) {
    console.error("[ai/synthesize] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
