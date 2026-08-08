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

const RATE_LIMIT = { max: 120, windowMs: 60_000 }; // 120 / min / IP

/**
 * GET /api/library — list all saved papers for the local user.
 */
export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    await ensureLocalUser();
    const papers = await db.savedPaper.findMany({
      where: { userId: getLocalUserId() },
      orderBy: { savedAt: "desc" },
    });

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
      aiInsights: p.aiSummary ? safeParseJSON(p.aiSummary) : undefined,
      savedAt: p.savedAt,
    })) as AcademicPaper[];

    return NextResponse.json({ papers: result });
  } catch (err) {
    console.error("[library] GET error:", err);
    return NextResponse.json({ error: "Failed to load saved papers" }, { status: 500 });
  }
}

function safeParseJSON(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

/**
 * POST /api/library — save a paper.
 * Body: { paper: AcademicPaper }
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<{ paper: AcademicPaper }>(req, 512 * 1024);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!body.paper || !body.paper.title || typeof body.paper.title !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'paper' field" }, { status: 400 });
  }

  // Sanitize paper fields before persisting
  const p = body.paper;
  const sanitizedTitle = truncate(p.title, MAX_TITLE_LENGTH);
  const sanitizedAbstract = truncate(p.abstract || "", MAX_ABSTRACT_LENGTH);

  try {
    await ensureLocalUser();
    const userId = getLocalUserId();
    const existing = await db.savedPaper.findFirst({
      where: { userId, paperId: truncate(p.id, 500) },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadySaved: true });
    }

    await db.savedPaper.create({
      data: {
        userId,
        paperId: truncate(p.id, 500),
        title: sanitizedTitle,
        authors: (p.authors || []).slice(0, 50).map((a) => truncate(String(a), 200)).join("|||"),
        abstract: sanitizedAbstract,
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
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);
  try {
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("paperId");
    if (!paperId || paperId.length > 500) {
      return NextResponse.json({ error: "Missing or invalid 'paperId' query parameter" }, { status: 400 });
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
