import { NextRequest, NextResponse } from "next/server";
import { fetchAuthorProfile } from "@/lib/ai/assistant";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/author?name=Author+Name
 *
 * Fetches an author's profile (affiliations, paper count, h-index, recent papers)
 * using the Semantic Scholar Author Search API. Also returns whether the local
 * user is following this author.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Missing 'name' query parameter" }, { status: 400 });
    }

    const profile = await fetchAuthorProfile(name);

    // Check if the local user is following this author
    await ensureLocalUser();
    const user = await db.userProfile.findUnique({ where: { id: getLocalUserId() } });
    const followedRaw = user?.followedAuthors || "[]";
    let followed: string[] = [];
    try {
      followed = JSON.parse(followedRaw);
    } catch {
      followed = [];
    }
    const isFollowing = followed.some(
      (n) => n.toLowerCase() === profile.name.toLowerCase(),
    );

    return NextResponse.json({ profile, isFollowing });
  } catch (err) {
    console.error("[author] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/author — toggle follow status for an author.
 * Body: { name: string, action: "follow" | "unfollow" }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { name: string; action: "follow" | "unfollow" };
    if (!body.name || !body.action) {
      return NextResponse.json({ error: "Missing 'name' or 'action'" }, { status: 400 });
    }
    await ensureLocalUser();
    const userId = getLocalUserId();
    const user = await db.userProfile.findUnique({ where: { id: userId } });
    const followedRaw = user?.followedAuthors || "[]";
    let followed: string[] = [];
    try {
      followed = JSON.parse(followedRaw);
    } catch {
      followed = [];
    }

    if (body.action === "follow") {
      if (!followed.some((n) => n.toLowerCase() === body.name.toLowerCase())) {
        followed.push(body.name);
      }
    } else {
      followed = followed.filter((n) => n.toLowerCase() !== body.name.toLowerCase());
    }

    await db.userProfile.update({
      where: { id: userId },
      data: { followedAuthors: JSON.stringify(followed) },
    });

    return NextResponse.json({ ok: true, followedAuthors: followed });
  } catch (err) {
    console.error("[author] PUT error:", err);
    return NextResponse.json({ error: "Failed to update follow status" }, { status: 500 });
  }
}
