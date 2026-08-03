import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/history — list recent searches for the local user.
 */
export async function GET() {
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
        filters: h.filters ? JSON.parse(h.filters) : null,
        resultCount: h.resultCount,
        createdAt: h.createdAt,
      })),
    });
  } catch (err) {
    console.error("[history] error:", err);
    return NextResponse.json({ error: "Failed to load search history" }, { status: 500 });
  }
}
