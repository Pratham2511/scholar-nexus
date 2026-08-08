import { NextRequest, NextResponse } from "next/server";
import { fetchCitationGraph } from "@/lib/ai/assistant";
import type { CitationGraph } from "@/lib/academic/types";
import {
  checkRateLimit,
  rateLimitedResponse,
  truncate,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 30, windowMs: 60_000 };

/**
 * GET /api/citations?paperId=xxx&title=yyy&type=refs|cites
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("paperId");
    const title = searchParams.get("title");
    const type = (searchParams.get("type") || "refs") as "refs" | "cites";

    if (!paperId || paperId.length > 500) {
      return NextResponse.json({ error: "Missing or invalid 'paperId' query parameter" }, { status: 400 });
    }
    if (!title || title.length > 1000) {
      return NextResponse.json({ error: "Missing or invalid 'title' query parameter" }, { status: 400 });
    }
    if (type !== "refs" && type !== "cites") {
      return NextResponse.json({ error: "Invalid 'type' — must be 'refs' or 'cites'" }, { status: 400 });
    }

    const result = (await fetchCitationGraph(
      truncate(paperId, 500),
      truncate(title, 1000),
      type,
    )) as CitationGraph;
    return NextResponse.json(result);
  } catch (err) {
    console.error("[citations] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
