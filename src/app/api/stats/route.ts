import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 120, windowMs: 60_000 };

/**
 * GET /api/stats — returns aggregate activity stats for the local user.
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    await ensureLocalUser();
    const userId = getLocalUserId();

    const [totalSearches, totalPapersSaved, totalCollections, totalAlerts] = await Promise.all([
      db.searchHistory.count({ where: { userId } }),
      db.savedPaper.count({ where: { userId } }),
      db.collection.count({ where: { userId } }),
      db.searchAlert.count({ where: { userId } }),
    ]);

    const totalSourcesActive = 9;

    return NextResponse.json({
      totalSearches,
      totalPapersSaved,
      totalCollections,
      totalAlerts,
      totalSourcesActive,
    });
  } catch (err) {
    console.error("[stats] error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
