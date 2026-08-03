import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import type { AcademicPaper } from "@/lib/academic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/library — list all saved papers for the local user.
 */
export async function GET() {
  try {
    await ensureLocalUser();
    const papers = await db.savedPaper.findMany({
      where: { userId: getLocalUserId() },
      orderBy: { savedAt: "desc" },
    });

    // Convert DB rows back to AcademicPaper shape for the frontend.
    const result = papers.map((p) => ({
      id: p.paperId,
      title: p.title,
      authors: p.authors ? p.authors.split("|||").filter(Boolean) : [],
      abstract: p.abstract || "",
      year: p.year,
      doi: p.doi,
      pdfLink: p.pdfLink,
      citationCount: p.citationCount ?? 0,
      publisher: p.publisher,
      sources: p.source ? [p.source] : [],
      sourceUrls: [],
      keywords: p.keywords ? p.keywords.split("|||").filter(Boolean) : [],
      openAccess: p.openAccess,
      paperType: null,
      venue: p.publisher,
      aiInsights: p.aiSummary ? JSON.parse(p.aiSummary) : undefined,
      savedAt: p.savedAt,
    })) as AcademicPaper[];

    return NextResponse.json({ papers: result });
  } catch (err) {
    console.error("[library] GET error:", err);
    return NextResponse.json({ error: "Failed to load saved papers" }, { status: 500 });
  }
}

/**
 * POST /api/library — save a paper.
 * Body: { paper: AcademicPaper }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { paper: AcademicPaper };
    if (!body.paper || !body.paper.title) {
      return NextResponse.json({ error: "Missing or invalid 'paper' field" }, { status: 400 });
    }

    await ensureLocalUser();
    const p = body.paper;
    const existing = await db.savedPaper.findFirst({
      where: { userId: getLocalUserId(), paperId: p.id },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadySaved: true });
    }

    await db.savedPaper.create({
      data: {
        userId: getLocalUserId(),
        paperId: p.id,
        title: p.title,
        authors: (p.authors || []).join("|||"),
        abstract: p.abstract,
        year: p.year ?? null,
        doi: p.doi ?? null,
        pdfLink: p.pdfLink ?? null,
        citationCount: p.citationCount ?? 0,
        publisher: p.publisher ?? null,
        source: (p.sources && p.sources[0]) ?? null,
        keywords: (p.keywords || []).join("|||"),
        openAccess: !!p.openAccess,
        aiSummary: p.aiInsights ? JSON.stringify(p.aiInsights) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[library] POST error:", err);
    return NextResponse.json({ error: "Failed to save paper" }, { status: 500 });
  }
}

/**
 * DELETE /api/library?paperId=xxx — remove a saved paper.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("paperId");
    if (!paperId) {
      return NextResponse.json({ error: "Missing 'paperId' query parameter" }, { status: 400 });
    }

    await ensureLocalUser();
    await db.savedPaper.deleteMany({
      where: { userId: getLocalUserId(), paperId },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[library] DELETE error:", err);
    return NextResponse.json({ error: "Failed to remove paper" }, { status: 500 });
  }
}
