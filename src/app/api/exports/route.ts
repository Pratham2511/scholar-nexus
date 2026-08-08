import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 120, windowMs: 60_000 };

/**
 * GET /api/exports — list recent citation exports for the local user.
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    await ensureLocalUser();
    const records = await db.exportRecord.findMany({
      where: { userId: getLocalUserId() },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({
      exports: records.map((r) => ({
        id: r.id,
        paperTitle: r.paperTitle,
        format: r.format,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("[exports] error:", err);
    return NextResponse.json({ error: "Failed to load export history" }, { status: 500 });
  }
}
