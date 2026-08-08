import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 120, windowMs: 60_000 };

/**
 * GET /api/history — list recent searches for the local user.
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    await ensureLocalUser();
    const history = await db.searchHistory.findMany({
      where: { userId: getLocalUserId() },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({
      history: history.map((h) => ({
        id: h.id,
        query: h.query,
        filters: h.filters ? safeJsonParse(h.filters) : null,
        resultCount: h.resultCount,
        createdAt: h.createdAt,
      })),
    });
  } catch (err) {
    console.error("[history] error:", err);
    return NextResponse.json({ error: "Failed to load search history" }, { status: 500 });
  }
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
