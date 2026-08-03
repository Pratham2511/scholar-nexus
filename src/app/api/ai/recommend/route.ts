import { NextRequest, NextResponse } from "next/server";
import { recommendTopics } from "@/lib/ai/assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RecommendRequestBody {
  titles: string[];
  currentQuery?: string;
}

/**
 * POST /api/ai/recommend
 * Suggests related research topics based on the user's saved papers or current search.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecommendRequestBody;
    if (!Array.isArray(body.titles)) {
      return NextResponse.json({ error: "Missing or invalid 'titles' field" }, { status: 400 });
    }

    const topics = await recommendTopics(body.titles, body.currentQuery);
    return NextResponse.json({ topics });
  } catch (err) {
    console.error("[ai/recommend] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
