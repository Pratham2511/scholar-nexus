import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/collections — list all collections for the local user (with paper counts).
 */
export async function GET() {
  try {
    await ensureLocalUser();
    const collections = await db.collection.findMany({
      where: { userId: getLocalUserId() },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { papers: true } } },
    });
    return NextResponse.json({
      collections: collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        color: c.color,
        paperCount: c._count.papers,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    console.error("[collections] GET error:", err);
    return NextResponse.json({ error: "Failed to load collections" }, { status: 500 });
  }
}

/**
 * POST /api/collections — create a new collection.
 * Body: { name: string, description?: string, color?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name: string; description?: string; color?: string };
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Missing or invalid 'name' field" }, { status: 400 });
    }
    await ensureLocalUser();
    const created = await db.collection.create({
      data: {
        userId: getLocalUserId(),
        name: body.name.trim(),
        description: body.description?.trim() || null,
        color: body.color || "#6366f1",
      },
    });
    return NextResponse.json({
      collection: {
        id: created.id,
        name: created.name,
        description: created.description,
        color: created.color,
        paperCount: 0,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
    });
  } catch (err) {
    console.error("[collections] POST error:", err);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}

/**
 * DELETE /api/collections?id=xxx — delete a collection (and all its paper associations).
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query parameter" }, { status: 400 });
    }
    await ensureLocalUser();
    await db.collection.deleteMany({
      where: { id, userId: getLocalUserId() },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[collections] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
