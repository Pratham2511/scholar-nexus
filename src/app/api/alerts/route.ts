import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import type { SearchFilters } from "@/lib/academic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/alerts — list all search alerts for the local user.
 */
export async function GET() {
  try {
    await ensureLocalUser();
    const alerts = await db.searchAlert.findMany({
      where: { userId: getLocalUserId() },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      alerts: alerts.map((a) => ({
        id: a.id,
        query: a.query,
        filters: a.filters ? (JSON.parse(a.filters) as SearchFilters) : {},
        frequency: a.frequency as "daily" | "weekly",
        createdAt: a.createdAt,
        lastRunAt: a.lastRunAt,
      })),
    });
  } catch (err) {
    console.error("[alerts] GET error:", err);
    return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 });
  }
}

/**
 * POST /api/alerts — create a new search alert.
 * Body: { query: string, filters?: SearchFilters, frequency: "daily" | "weekly" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      query: string;
      filters?: SearchFilters;
      frequency: "daily" | "weekly";
    };
    if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid 'query'" }, { status: 400 });
    }
    if (body.frequency !== "daily" && body.frequency !== "weekly") {
      return NextResponse.json({ error: "Invalid 'frequency' — must be 'daily' or 'weekly'" }, { status: 400 });
    }
    await ensureLocalUser();
    const created = await db.searchAlert.create({
      data: {
        userId: getLocalUserId(),
        query: body.query.trim(),
        filters: JSON.stringify(body.filters || {}),
        frequency: body.frequency,
      },
    });
    return NextResponse.json({
      alert: {
        id: created.id,
        query: created.query,
        filters: JSON.parse(created.filters) as SearchFilters,
        frequency: created.frequency as "daily" | "weekly",
        createdAt: created.createdAt,
        lastRunAt: created.lastRunAt,
      },
    });
  } catch (err) {
    console.error("[alerts] POST error:", err);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

/**
 * DELETE /api/alerts?id=xxx — delete a search alert.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query parameter" }, { status: 400 });
    }
    await ensureLocalUser();
    await db.searchAlert.deleteMany({
      where: { id, userId: getLocalUserId() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[alerts] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
