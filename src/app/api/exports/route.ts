import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/exports — list recent citation exports for the local user.
 */
export async function GET() {
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
