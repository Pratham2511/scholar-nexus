import { NextRequest, NextResponse } from "next/server";
import { fetchCitationGraph } from "@/lib/ai/assistant";
import type { CitationGraph } from "@/lib/academic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/citations?paperId=xxx&title=yyy&type=refs|cites
 *
 * Fetches the references or citations of a paper via Semantic Scholar.
 * - type=refs  → papers that THIS paper cites
 * - type=cites → papers that cite THIS paper
 *
 * If the paperId is not a Semantic Scholar ID, falls back to a title-based lookup.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("paperId");
    const title = searchParams.get("title");
    const type = (searchParams.get("type") || "refs") as "refs" | "cites";

    if (!paperId || !title) {
      return NextResponse.json({ error: "Missing 'paperId' or 'title' query parameter" }, { status: 400 });
    }
    if (type !== "refs" && type !== "cites") {
      return NextResponse.json({ error: "Invalid 'type' — must be 'refs' or 'cites'" }, { status: 400 });
    }

    const result = (await fetchCitationGraph(paperId, title, type)) as CitationGraph;
    return NextResponse.json(result);
  } catch (err) {
    console.error("[citations] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
