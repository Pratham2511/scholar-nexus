import { NextRequest, NextResponse } from "next/server";
import { fetchAuthorProfile } from "@/lib/ai/assistant";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import {
  checkRateLimit,
  rateLimitedResponse,
  readJsonBody,
  truncate,
  MAX_AUTHOR_NAME_LENGTH,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 30, windowMs: 60_000 };

/**
 * GET /api/author?name=Author+Name
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Missing 'name' query parameter" }, { status: 400 });
    }
    if (name.length > MAX_AUTHOR_NAME_LENGTH) {
      return NextResponse.json({ error: "Author name too long" }, { status: 400 });
    }

    const profile = await fetchAuthorProfile(name.trim());

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
      (n) => typeof n === "string" && n.toLowerCase() === profile.name.toLowerCase(),
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
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<{ name: string; action: "follow" | "unfollow" }>(req);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Missing 'name'" }, { status: 400 });
  }
  if (body.action !== "follow" && body.action !== "unfollow") {
    return NextResponse.json({ error: "Invalid 'action' — must be 'follow' or 'unfollow'" }, { status: 400 });
  }
  if (body.name.length > MAX_AUTHOR_NAME_LENGTH) {
    return NextResponse.json({ error: "Author name too long" }, { status: 400 });
  }

  const name = truncate(body.name.trim(), MAX_AUTHOR_NAME_LENGTH);

  try {
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
      if (!followed.some((n) => typeof n === "string" && n.toLowerCase() === name.toLowerCase())) {
        followed.push(name);
      }
    } else {
      followed = followed.filter(
        (n) => typeof n === "string" && n.toLowerCase() !== name.toLowerCase(),
      );
    }

    await db.userProfile.update({
      where: { id: userId },
      data: { followedAuthors: JSON.stringify(followed.slice(0, 200)) }, // cap at 200 followed authors
    });

    return NextResponse.json({ ok: true, followedAuthors: followed });
  } catch (err) {
    console.error("[author] PUT error:", err);
    return NextResponse.json({ error: "Failed to update follow status" }, { status: 500 });
  }
}
