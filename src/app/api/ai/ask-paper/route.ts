import { NextRequest, NextResponse } from "next/server";
import { askPaperQuestion } from "@/lib/ai/assistant";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AskPaperBody {
  pdfUrl: string;
  question: string;
  paperId: string;
}

/**
 * POST /api/ai/ask-paper
 *
 * Answers a natural-language question about a paper by:
 *   1. Fetching the paper's PDF
 *   2. Extracting text via pdf-parse
 *   3. Chunking and selecting the most relevant chunks
 *   4. Asking the LLM with a strict prompt
 *
 * Caches the (paperId, question, answer) tuple in PaperQA for future retrieval.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AskPaperBody;
    if (!body.pdfUrl || !body.question || !body.paperId) {
      return NextResponse.json(
        { error: "Missing 'pdfUrl', 'question', or 'paperId'" },
        { status: 400 },
      );
    }
    if (body.question.trim().length < 3) {
      return NextResponse.json(
        { error: "Question is too short" },
        { status: 400 },
      );
    }

    // Check the cache first
    await ensureLocalUser();
    const userId = getLocalUserId();
    const cached = await db.paperQA.findFirst({
      where: { userId, paperId: body.paperId, question: body.question.trim() },
      orderBy: { createdAt: "desc" },
    });
    if (cached) {
      return NextResponse.json({
        answer: cached.answer,
        confidence: "cached" as const,
        cached: true,
      });
    }

    // Generate a new answer
    const { answer, confidence } = await askPaperQuestion(body.pdfUrl, body.question.trim());

    // Persist to cache (fire-and-forget)
    void db.paperQA
      .create({
        data: {
          userId,
          paperId: body.paperId,
          question: body.question.trim(),
          answer,
        },
      })
      .catch((e) => console.error("[ask-paper] failed to cache:", e));

    return NextResponse.json({ answer, confidence, cached: false });
  } catch (err) {
    console.error("[ai/ask-paper] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
