import { NextRequest, NextResponse } from "next/server";
import { recommendTopics } from "@/lib/ai/assistant";
import {
  checkRateLimit,
  rateLimitedResponse,
  readJsonBody,
  truncate,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RecommendRequestBody {
  titles: string[];
  currentQuery?: string;
}

const RATE_LIMIT = { max: 30, windowMs: 60_000 };
const MAX_TITLES = 50;
const MAX_TITLE_LEN = 500;

/**
 * POST /api/ai/recommend
 * Suggests related research topics based on the user's saved papers or current search.
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<RecommendRequestBody>(req, 512 * 1024);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!Array.isArray(body.titles)) {
    return NextResponse.json({ error: "Missing or invalid 'titles' field" }, { status: 400 });
  }

  const titles = body.titles
    .slice(0, MAX_TITLES)
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => truncate(t, MAX_TITLE_LEN));
  const currentQuery = body.currentQuery ? truncate(body.currentQuery, 1000) : undefined;

  try {
    const topics = await recommendTopics(titles, currentQuery);
    return NextResponse.json({ topics });
  } catch (err) {
    console.error("[ai/recommend] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
