import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profile — return local user profile + favorite topics + stats.
 */
export async function GET() {
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
  try {
    const body = (await req.json()) as {
      name?: string;
      affiliation?: string;
      researchInterests?: string;
    };
    await ensureLocalUser();
    const updated = await db.userProfile.update({
      where: { id: getLocalUserId() },
      data: {
        name: body.name,
        affiliation: body.affiliation,
        researchInterests: body.researchInterests,
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
  try {
    const body = (await req.json()) as { action: "add" | "remove"; topic: string };
    if (!body.topic || !body.action) {
      return NextResponse.json({ error: "Missing 'action' or 'topic'" }, { status: 400 });
    }
    await ensureLocalUser();
    if (body.action === "add") {
      try {
        await db.favoriteTopic.create({
          data: { userId: getLocalUserId(), topic: body.topic },
        });
      } catch {
        // Already exists — ignore
      }
    } else if (body.action === "remove") {
      await db.favoriteTopic.deleteMany({
        where: { userId: getLocalUserId(), topic: body.topic },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[profile] PUT error:", err);
    return NextResponse.json({ error: "Failed to update favorites" }, { status: 500 });
  }
}
