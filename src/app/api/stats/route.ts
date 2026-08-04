import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stats — returns aggregate activity stats for the local user.
 * Used by the Home page stats bar.
 */
export async function GET() {
  try {
    await ensureLocalUser();
    const userId = getLocalUserId();

    const [totalSearches, totalPapersSaved, totalCollections, totalAlerts] = await Promise.all([
      db.searchHistory.count({ where: { userId } }),
      db.savedPaper.count({ where: { userId } }),
      db.collection.count({ where: { userId } }),
      db.searchAlert.count({ where: { userId } }),
    ]);

    // Count active sources. We always enable 9 by default (CORE is opt-in).
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
