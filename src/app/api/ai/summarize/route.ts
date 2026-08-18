import { NextRequest, NextResponse } from "next/server";
import { summarizePaper } from "@/lib/ai/assistant";
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
export const maxDuration = 60;

interface SummarizeRequestBody {
  title: string;
  abstract: string;
  userQuery?: string;
}

const RATE_LIMIT = { max: 30, windowMs: 60_000 }; // 30 / min / IP

/**
 * POST /api/ai/summarize
 * Generates AI insights (summary, contributions, advantages, limitations, future scope) for a paper.
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<SummarizeRequestBody>(req);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "Missing 'title' field" }, { status: 400 });
  }

  const title = truncate(body.title, MAX_TITLE_LENGTH);
  const abstract = truncate(body.abstract || "", MAX_ABSTRACT_LENGTH);
  const userQuery = body.userQuery ? truncate(body.userQuery, 1000) : undefined;

  try {
    const insights = await summarizePaper(title, abstract, userQuery);
    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[ai/summarize] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
