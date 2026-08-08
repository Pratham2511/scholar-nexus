import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import type { AcademicPaper } from "@/lib/academic/types";
import {
  checkRateLimit,
  rateLimitedResponse,
  readJsonBody,
  truncate,
  MAX_TITLE_LENGTH,
  MAX_ABSTRACT_LENGTH,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE_LIMIT = { max: 120, windowMs: 60_000 };

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
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");
    if (!collectionId || collectionId.length > 100) {
      return NextResponse.json({ error: "Missing or invalid 'collectionId' query parameter" }, { status: 400 });
    }
    await ensureLocalUser();
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
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<AddPaperBody>(req, 512 * 1024);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!body.collectionId || typeof body.collectionId !== "string") {
    return NextResponse.json({ error: "Missing 'collectionId'" }, { status: 400 });
  }
  if (!body.paper || !body.paper.title || typeof body.paper.title !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'paper'" }, { status: 400 });
  }

  const collectionId = truncate(body.collectionId, 100);
  const notes = body.notes ? truncate(body.notes, 5000) : null;
  const p = body.paper;

  try {
    await ensureLocalUser();
    const userId = getLocalUserId();

    // Verify ownership of the collection
    const collection = await db.collection.findFirst({
      where: { id: collectionId, userId },
    });
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Save the paper to SavedPaper if not already there (so we have a snapshot)
    const paperId = truncate(p.id, 500);
    const existing = await db.savedPaper.findFirst({
      where: { userId, paperId },
    });
    if (!existing) {
      await db.savedPaper.create({
        data: {
          userId,
          paperId,
          title: truncate(p.title, MAX_TITLE_LENGTH),
          authors: (p.authors || []).slice(0, 50).map((a) => truncate(String(a), 200)).join("|||"),
          abstract: truncate(p.abstract || "", MAX_ABSTRACT_LENGTH),
          year: typeof p.year === "number" ? p.year : null,
          doi: p.doi ? truncate(String(p.doi), 200) : null,
          pdfLink: p.pdfLink ? truncate(String(p.pdfLink), 2000) : null,
          citationCount: typeof p.citationCount === "number" ? p.citationCount : 0,
          publisher: p.publisher ? truncate(String(p.publisher), 300) : null,
          source: (p.sources && p.sources[0]) ? truncate(String(p.sources[0]), 100) : null,
          keywords: (p.keywords || []).slice(0, 30).map((k) => truncate(String(k), 100)).join("|||"),
          openAccess: !!p.openAccess,
          aiSummary: p.aiInsights ? JSON.stringify(p.aiInsights).slice(0, 32_000) : null,
        },
      });
    }

    // Add to collection (idempotent — if already there, just update notes)
    const existingLink = await db.collectionPaper.findFirst({
      where: { collectionId, paperId },
    });
    if (existingLink) {
      if (notes !== undefined) {
        await db.collectionPaper.update({
          where: { id: existingLink.id },
          data: { notes },
        });
      }
      return NextResponse.json({ ok: true, alreadyInCollection: true });
    }

    await db.collectionPaper.create({
      data: {
        collectionId,
        paperId,
        notes,
      },
    });

    // Touch the collection's updatedAt
    await db.collection.update({
      where: { id: collectionId },
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
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");
    const paperId = searchParams.get("paperId");
    if (!collectionId || collectionId.length > 100 || !paperId || paperId.length > 500) {
      return NextResponse.json({ error: "Missing or invalid 'collectionId' or 'paperId'" }, { status: 400 });
    }
    await ensureLocalUser();
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
