import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import type { AcademicPaper } from "@/lib/academic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AddPaperBody {
  collectionId: string;
  paper: AcademicPaper;
  notes?: string;
}

/**
 * GET /api/collections/paper?collectionId=xxx
 * Lists all papers in a collection.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");
    if (!collectionId) {
      return NextResponse.json({ error: "Missing 'collectionId' query parameter" }, { status: 400 });
    }
    await ensureLocalUser();
    // Verify the collection belongs to the local user
    const collection = await db.collection.findFirst({
      where: { id: collectionId, userId: getLocalUserId() },
    });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    const collectionPapers = await db.collectionPaper.findMany({
      where: { collectionId },
      orderBy: { addedAt: "desc" },
    });
    return NextResponse.json({
      papers: collectionPapers.map((cp) => ({
        paperId: cp.paperId,
        notes: cp.notes,
        addedAt: cp.addedAt,
      })),
    });
  } catch (err) {
    console.error("[collections/paper] GET error:", err);
    return NextResponse.json({ error: "Failed to list collection papers" }, { status: 500 });
  }
}

/**
 * POST /api/collections/paper
 * Add a paper to a collection. Also saves the paper to SavedPaper if not already saved
 * (so the paper is always retrievable).
 * Body: { collectionId: string, paper: AcademicPaper, notes?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AddPaperBody;
    if (!body.collectionId || !body.paper || !body.paper.title) {
      return NextResponse.json({ error: "Missing 'collectionId' or 'paper'" }, { status: 400 });
    }
    await ensureLocalUser();
    const userId = getLocalUserId();

    // Verify ownership of the collection
    const collection = await db.collection.findFirst({
      where: { id: body.collectionId, userId },
    });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Save the paper to SavedPaper if not already there (so we have a snapshot)
    const existing = await db.savedPaper.findFirst({
      where: { userId, paperId: body.paper.id },
    });
    if (!existing) {
      await db.savedPaper.create({
        data: {
          userId,
          paperId: body.paper.id,
          title: body.paper.title,
          authors: (body.paper.authors || []).join("|||"),
          abstract: body.paper.abstract,
          year: body.paper.year ?? null,
          doi: body.paper.doi ?? null,
          pdfLink: body.paper.pdfLink ?? null,
          citationCount: body.paper.citationCount ?? 0,
          publisher: body.paper.publisher ?? null,
          source: (body.paper.sources && body.paper.sources[0]) ?? null,
          keywords: (body.paper.keywords || []).join("|||"),
          openAccess: !!body.paper.openAccess,
          aiSummary: body.paper.aiInsights ? JSON.stringify(body.paper.aiInsights) : null,
        },
      });
    }

    // Add to collection (idempotent — if already there, just update notes)
    const existingLink = await db.collectionPaper.findFirst({
      where: { collectionId: body.collectionId, paperId: body.paper.id },
    });
    if (existingLink) {
      if (body.notes !== undefined) {
        await db.collectionPaper.update({
          where: { id: existingLink.id },
          data: { notes: body.notes },
        });
      }
      return NextResponse.json({ ok: true, alreadyInCollection: true });
    }

    await db.collectionPaper.create({
      data: {
        collectionId: body.collectionId,
        paperId: body.paper.id,
        notes: body.notes || null,
      },
    });

    // Touch the collection's updatedAt
    await db.collection.update({
      where: { id: body.collectionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[collections/paper] POST error:", err);
    return NextResponse.json({ error: "Failed to add paper to collection" }, { status: 500 });
  }
}

/**
 * DELETE /api/collections/paper?collectionId=xxx&paperId=yyy
 * Remove a paper from a collection.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");
    const paperId = searchParams.get("paperId");
    if (!collectionId || !paperId) {
      return NextResponse.json({ error: "Missing 'collectionId' or 'paperId'" }, { status: 400 });
    }
    await ensureLocalUser();
    // Verify ownership
    const collection = await db.collection.findFirst({
      where: { id: collectionId, userId: getLocalUserId() },
    });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    await db.collectionPaper.deleteMany({
      where: { collectionId, paperId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[collections/paper] DELETE error:", err);
    return NextResponse.json({ error: "Failed to remove paper from collection" }, { status: 500 });
  }
}
