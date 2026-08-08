import { NextRequest, NextResponse } from "next/server";
import { exportCitation, type CitationFormat } from "@/lib/citation";
import type { AcademicPaper } from "@/lib/academic/types";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { db } from "@/lib/db";
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

interface CitationRequestBody {
  paper: AcademicPaper;
  format: CitationFormat;
}

const FORMATS: CitationFormat[] = ["APA", "MLA", "BibTeX", "Chicago"];
const RATE_LIMIT = { max: 60, windowMs: 60_000 };

/**
 * POST /api/citation
 * Returns a formatted citation string for the given paper.
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<CitationRequestBody>(req);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!body.paper || !body.paper.title || typeof body.paper.title !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'paper' field" }, { status: 400 });
  }
  if (!FORMATS.includes(body.format)) {
    return NextResponse.json({ error: `Invalid format. Supported: ${FORMATS.join(", ")}` }, { status: 400 });
  }

  // Sanitize paper fields before using them in citation generation
  const sanitizedPaper: AcademicPaper = {
    ...body.paper,
    title: truncate(body.paper.title, MAX_TITLE_LENGTH),
    abstract: truncate(body.paper.abstract || "", MAX_ABSTRACT_LENGTH),
    authors: (body.paper.authors || []).slice(0, 50).map((a) => truncate(String(a), 200)),
    doi: body.paper.doi ? truncate(String(body.paper.doi), 200) : null,
    publisher: body.paper.publisher ? truncate(String(body.paper.publisher), 300) : null,
    venue: body.paper.venue ? truncate(String(body.paper.venue), 300) : null,
  };

  try {
    const citation = exportCitation(sanitizedPaper, body.format);

    // Persist export record
    void persistExport(sanitizedPaper.title, body.format).catch((e) => {
      console.error("[citation] failed to persist export:", e);
    });

    return NextResponse.json({ citation, format: body.format });
  } catch (err) {
    console.error("[citation] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function persistExport(title: string, format: string) {
  await ensureLocalUser();
  await db.exportRecord.create({
    data: {
      userId: getLocalUserId(),
      paperTitle: title,
      format,
    },
  });
}
