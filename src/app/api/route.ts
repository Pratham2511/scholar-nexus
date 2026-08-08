import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api — health-check endpoint.
 * Returns minimal service info without exposing internals (no versions, no paths).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "scholar-nexus-api",
    time: new Date().toISOString(),
  });
}
