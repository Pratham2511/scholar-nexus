import { NextRequest, NextResponse } from "next/server";
import { askPaperQuestion } from "@/lib/ai/assistant";
import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import {
  checkRateLimit,
  rateLimitedResponse,
  readJsonBody,
  truncate,
  MAX_QUERY_LENGTH,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AskPaperBody {
  pdfUrl: string;
  question: string;
  paperId: string;
}

const RATE_LIMIT = { max: 10, windowMs: 60_000 }; // 10 / min / IP — PDF fetch + LLM is expensive

/**
 * POST /api/ai/ask-paper
 *
 * Answers a natural-language question about a paper by:
 *   1. Fetching the paper's PDF (with SSRF guard inside askPaperQuestion)
 *   2. Extracting text via unpdf
 *   3. Chunking and selecting the most relevant chunks
 *   4. Asking the LLM with a strict prompt
 *
 * Caches the (paperId, question, answer) tuple in PaperQA for future retrieval.
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMIT);
  if (!rl.ok) return rateLimitedResponse(rl);

  const bodyResult = await readJsonBody<AskPaperBody>(req);
  if (!bodyResult.ok) return bodyResult.response;
  const body = bodyResult.data;

  if (!body.pdfUrl || typeof body.pdfUrl !== "string") {
    return NextResponse.json(
      { error: "Missing 'pdfUrl'" },
      { status: 400 },
    );
  }
  if (!body.paperId || typeof body.paperId !== "string") {
    return NextResponse.json(
      { error: "Missing 'paperId'" },
      { status: 400 },
    );
  }
  if (!body.question || typeof body.question !== "string") {
    return NextResponse.json(
      { error: "Missing 'question'" },
      { status: 400 },
    );
  }
  if (body.question.trim().length < 3) {
    return NextResponse.json(
      { error: "Question is too short" },
      { status: 400 },
    );
  }
  if (body.question.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Question too long (max ${MAX_QUERY_LENGTH} chars)` },
      { status: 400 },
    );
  }

  const pdfUrl = truncate(body.pdfUrl, 2000);
  const question = body.question.trim();
  const paperId = truncate(body.paperId, 500);

  try {
    // Check the cache first
    await ensureLocalUser();
    const userId = getLocalUserId();
    const cached = await db.paperQA.findFirst({
      where: { userId, paperId, question },
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
    const { answer, confidence } = await askPaperQuestion(pdfUrl, question);

    // Persist to cache (fire-and-forget)
    void db.paperQA
      .create({
        data: {
          userId,
          paperId,
          question,
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
