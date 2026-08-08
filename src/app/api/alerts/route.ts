import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import type { SearchFilters } from "@/lib/academic/types";
import {
  checkRateLimit,
  rateLimitedResponse,
  readJsonBody,
  truncate,
  MAX_QUERY_LENGTH,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 60, windowMs: 60_000 };

/**
 * GET /api/alerts — list all search alerts for the local user.
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
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
        filters: a.filters ? safeJsonParse(a.filters) : {},
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

function safeJsonParse(s: string): SearchFilters {
  try {
    return JSON.parse(s) as SearchFilters;
  } catch {
    return {};
  }
}

/**
 * POST /api/alerts — create a new search alert.
 * Body: { query: string, filters?: SearchFilters, frequency: "daily" | "weekly" }
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<{
    query: string;
    filters?: SearchFilters;
    frequency: "daily" | "weekly";
  }>(req);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!body.query || typeof body.query !== "string" || body.query.trim().length === 0) {
    return NextResponse.json({ error: "Missing or invalid 'query'" }, { status: 400 });
  }
  if (body.query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `Query too long (max ${MAX_QUERY_LENGTH} chars)` }, { status: 400 });
  }
  if (body.frequency !== "daily" && body.frequency !== "weekly") {
    return NextResponse.json({ error: "Invalid 'frequency' — must be 'daily' or 'weekly'" }, { status: 400 });
  }

  try {
    await ensureLocalUser();
    const created = await db.searchAlert.create({
      data: {
        userId: getLocalUserId(),
        query: truncate(body.query.trim(), MAX_QUERY_LENGTH),
        filters: JSON.stringify(body.filters || {}),
        frequency: body.frequency,
      },
    });
    return NextResponse.json({
      alert: {
        id: created.id,
        query: created.query,
        filters: safeJsonParse(created.filters),
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
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "Missing or invalid 'id' query parameter" }, { status: 400 });
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
