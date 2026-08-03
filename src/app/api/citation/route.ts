import { NextRequest, NextResponse } from "next/server";
import { exportCitation, type CitationFormat } from "@/lib/citation";
import type { AcademicPaper } from "@/lib/academic/types";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CitationRequestBody {
  paper: AcademicPaper;
  format: CitationFormat;
}

const FORMATS: CitationFormat[] = ["APA", "MLA", "BibTeX", "Chicago"];

/**
 * POST /api/citation
 * Returns a formatted citation string for the given paper.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CitationRequestBody;
    if (!body.paper || !body.paper.title) {
      return NextResponse.json({ error: "Missing or invalid 'paper' field" }, { status: 400 });
    }
    if (!FORMATS.includes(body.format)) {
      return NextResponse.json({ error: `Invalid format. Supported: ${FORMATS.join(", ")}` }, { status: 400 });
    }

    const citation = exportCitation(body.paper, body.format);

    // Persist export record
    void persistExport(body.paper.title, body.format).catch((e) => {
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
