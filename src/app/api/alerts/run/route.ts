import { NextRequest, NextResponse } from "next/server";
import { readWorkspace, writeWorkspace } from "@/lib/workspace/server";
import { searchMultipleSources, PROVIDERS } from "@/lib/academic/orchestrator";
import { applyAlertResult } from "@/lib/workspace/alerts";
import { prepareQuery } from "@/lib/academic/query";
import {
  readJsonBody,
  checkRateLimit,
  rateLimitedResponse,
} from "@/lib/security";
import type { SearchFilters } from "@/lib/academic/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let running = false;
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { max: 15, windowMs: 60000 });
  if (!rl.ok) return rateLimitedResponse(rl);
  if (running)
    return NextResponse.json(
      { error: "An alert check is already running. Try again shortly." },
      { status: 409 },
    );
  const body = await readJsonBody<{ id?: string }>(req);
  if (!body.ok) return body.response;
  if (
    !body.data ||
    typeof body.data !== "object" ||
    (body.data.id != null && typeof body.data.id !== "string")
  )
    return NextResponse.json({ error: "Invalid alert ID." }, { status: 400 });
  running = true;
  try {
    const initial = await readWorkspace();
    // One due alert per worker tick bounds latency and provider traffic.
    const alert = initial.state.alerts.find((a) =>
      body.data.id
        ? a.id === body.data.id
        : !a.lastRunAt ||
          Date.now() - Date.parse(a.lastRunAt) >=
            (a.frequency === "daily" ? 86400000 : 604800000),
    );
    if (!alert) return NextResponse.json({ checked: 0 });
    const result = await searchMultipleSources(
      prepareQuery(alert.query, alert.filters as SearchFilters),
      {
        sources: alert.providers.filter((p) => p in PROVIDERS),
        signal: req.signal,
      },
    );
    for (let attempt = 0; attempt < 3; attempt++) {
      const { state, revision } = await readWorkspace();
      const current = state.alerts.find((a) => a.id === alert.id);
      if (!current) return NextResponse.json({ checked: 0 });
      if (
        current.query !== alert.query ||
        JSON.stringify(current.filters) !== JSON.stringify(alert.filters)
      )
        return NextResponse.json(
          { error: "Alert changed during the check. Retry." },
          { status: 409 },
        );
      applyAlertResult(state, current.id, result, new Date().toISOString());
      if (await writeWorkspace(state, revision))
        return NextResponse.json(
          { checked: 1, error: result.error },
          { status: result.error ? 503 : 200 },
        );
    }
    return NextResponse.json(
      { error: "Workspace changed during the check. Please retry." },
      { status: 409 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Alert check failed." },
      { status: 503 },
    );
  } finally {
    running = false;
  }
}
