import { NextRequest, NextResponse } from "next/server";
import { summarizePaper } from "@/lib/ai/assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SummarizeRequestBody {
  title: string;
  abstract: string;
  userQuery?: string;
}

/**
 * POST /api/ai/summarize
 * Generates AI insights (summary, contributions, advantages, limitations, future scope) for a paper.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SummarizeRequestBody;
    if (!body.title) {
      return NextResponse.json({ error: "Missing 'title' field" }, { status: 400 });
    }

    const insights = await summarizePaper(body.title, body.abstract || "", body.userQuery);
    return NextResponse.json({ insights });
  } catch (err) {
    console.error("[ai/summarize] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
