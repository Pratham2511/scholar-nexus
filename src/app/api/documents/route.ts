import { NextRequest, NextResponse } from "next/server";
import { Worker } from "node:worker_threads";
import { createHash } from "node:crypto";
import path from "node:path";
import { checkRateLimit, rateLimitedResponse } from "@/lib/security";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { max: 10, windowMs: 60000 });
  if (!rl.ok) return rateLimitedResponse(rl);
  if (req.headers.get("content-type")?.split(";")[0] !== "application/pdf")
    return NextResponse.json(
      { error: "Upload a PDF document." },
      { status: 415 },
    );
  const max = 15 * 1024 * 1024;
  if (Number(req.headers.get("content-length")) > max)
    return NextResponse.json(
      { error: "PDF must be under 15 MB." },
      { status: 413 },
    );
  try {
    const reader = req.body?.getReader();
    if (!reader) throw new Error("Missing PDF");
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    const timer = setTimeout(
      () => void reader.cancel("Upload timed out"),
      15000,
    );
    try {
      while (true) {
        req.signal.throwIfAborted();
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > max) {
          await reader.cancel();
          throw new Error("PDF must be under 15 MB.");
        }
        chunks.push(value);
      }
    } finally {
      clearTimeout(timer);
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.subarray(0, 5).toString() !== "%PDF-")
      throw new Error("Invalid PDF signature.");
    const pages = await new Promise<{ page: number; text: string }[]>(
      (resolve, reject) => {
        const worker = new Worker(
          path.join(process.cwd(), "scripts/pdf-worker.mjs"),
          {
            workerData: buffer,
            resourceLimits: { maxOldGenerationSizeMb: 192 },
          },
        );
        const finish = () => {
          clearTimeout(deadline);
          req.signal.removeEventListener("abort", abort);
          void worker.terminate();
        };
        const abort = () => {
          finish();
          reject(new Error("Extraction canceled."));
        };
        const deadline = setTimeout(() => {
          finish();
          reject(new Error("PDF extraction exceeded 20 seconds."));
        }, 20000);
        req.signal.addEventListener("abort", abort, { once: true });
        worker.once("message", (m) => {
          finish();
          if (m.error) reject(new Error(m.error));
          else resolve(m.pages);
        });
        worker.once("error", (e) => {
          finish();
          reject(e);
        });
        worker.once("exit", (code) => {
          if (code !== 0) {
            finish();
            reject(new Error("PDF extraction stopped."));
          }
        });
      },
    );
    if (!pages.some((p) => p.text.trim()))
      throw new Error(
        "No readable text. This may be a scanned PDF; OCR is not available.",
      );
    return NextResponse.json({
      hash: createHash("sha256").update(buffer).digest("hex"),
      pages,
      limitations:
        "Extracted text may omit figures, tables, equations, and scanned pages. Verify against the original PDF.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not extract PDF." },
      { status: 422 },
    );
  }
}
