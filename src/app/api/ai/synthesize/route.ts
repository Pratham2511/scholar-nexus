import { NextRequest, NextResponse } from "next/server";
import { synthesizeEvidence } from "@/lib/ai/assistant";
import type { AcademicPaper } from "@/lib/academic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SynthesizeRequestBody {
  papers: AcademicPaper[];
  query: string;
}

/**
 * POST /api/ai/synthesize
 * Generates an AI evidence synthesis across multiple papers from a search.
 * Returns: { synthesis: EvidenceSynthesis }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SynthesizeRequestBody;
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

    const synthesis = await synthesizeEvidence(body.papers, body.query || "");
    return NextResponse.json({ synthesis });
  } catch (err) {
    console.error("[ai/synthesize] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
