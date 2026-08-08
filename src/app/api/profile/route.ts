import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import {
  checkRateLimit,
  rateLimitedResponse,
  truncate,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 120, windowMs: 60_000 };

/**
 * GET /api/profile — return local user profile + favorite topics + stats.
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    await ensureLocalUser();
    const user = await db.userProfile.findUnique({
      where: { id: getLocalUserId() },
    });
    const favorites = await db.favoriteTopic.findMany({
      where: { userId: getLocalUserId() },
      orderBy: { createdAt: "desc" },
    });
    const savedCount = await db.savedPaper.count({
      where: { userId: getLocalUserId() },
    });
    const searchCount = await db.searchHistory.count({
      where: { userId: getLocalUserId() },
    });
    return NextResponse.json({
      profile: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        affiliation: user?.affiliation,
        researchInterests: user?.researchInterests,
      },
      followedAuthors: (() => {
        try {
          return JSON.parse(user?.followedAuthors || "[]");
        } catch {
          return [];
        }
      })(),
      favorites: favorites.map((f) => f.topic),
      stats: { savedCount, searchCount },
    });
  } catch (err) {
    console.error("[profile] GET error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile — update the local user profile.
 */
export async function PATCH(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  let body: { name?: string; affiliation?: string; researchInterests?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await ensureLocalUser();
    const updated = await db.userProfile.update({
      where: { id: getLocalUserId() },
      data: {
        name: body.name != null ? truncate(String(body.name), 200) : undefined,
        affiliation: body.affiliation != null ? truncate(String(body.affiliation), 300) : undefined,
        researchInterests: body.researchInterests != null ? truncate(String(body.researchInterests), 2000) : undefined,
      },
    });
    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error("[profile] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

/**
 * PUT /api/profile — manage favorite topics.
 * Body: { action: "add" | "remove", topic: string }
 */
export async function PUT(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  let body: { action: "add" | "remove"; topic: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.topic || typeof body.topic !== "string") {
    return NextResponse.json({ error: "Missing 'topic'" }, { status: 400 });
  }
  if (body.action !== "add" && body.action !== "remove") {
    return NextResponse.json({ error: "Invalid 'action' — must be 'add' or 'remove'" }, { status: 400 });
  }

  const topic = truncate(body.topic.trim(), 200);

  try {
    await ensureLocalUser();
    if (body.action === "add") {
      try {
        await db.favoriteTopic.create({
          data: { userId: getLocalUserId(), topic },
        });
      } catch {
        // Already exists — ignore
      }
    } else {
      await db.favoriteTopic.deleteMany({
        where: { userId: getLocalUserId(), topic },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile] PUT error:", err);
    return NextResponse.json({ error: "Failed to update favorites" }, { status: 500 });
  }
}
