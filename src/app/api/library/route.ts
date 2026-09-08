import { NextRequest, NextResponse } from "next/server";
import { readWorkspace, writeWorkspace } from "@/lib/workspace/server";
import { paperSchema } from "@/lib/workspace/schema";
import { readJsonBody } from "@/lib/security";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({ papers: (await readWorkspace()).state.papers });
  } catch {
    return NextResponse.json(
      {
        error:
          "Saved research unavailable. Start PostgreSQL and apply migrations.",
      },
      { status: 503 },
    );
  }
}
export async function POST(req: NextRequest) {
  const body = await readJsonBody<{ paper: unknown }>(req, 512 * 1024);
  if (!body.ok) return body.response;
  const parsed = paperSchema.safeParse(body.data?.paper);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid paper metadata." },
      { status: 400 },
    );
  try {
    for (let i = 0; i < 3; i++) {
      const { state, revision } = await readWorkspace();
      if (!state.papers.some((p) => p.id === parsed.data.id))
        state.papers.unshift(parsed.data);
      if (await writeWorkspace(state, revision))
        return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { error: "Concurrent save. Please retry." },
      { status: 409 },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not save paper." },
      { status: 503 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("paperId");
  if (!id)
    return NextResponse.json({ error: "Missing paper ID." }, { status: 400 });
  try {
    const { state, revision } = await readWorkspace();
    if (
      state.projects.some((p) => p.members.some((m) => m.paperId === id)) ||
      state.evidence.some((e) => e.paperId === id)
    )
      return NextResponse.json(
        {
          error:
            "This paper supports a project or evidence. Remove those references before deleting it.",
        },
        { status: 409 },
      );
    state.papers = state.papers.filter((p) => p.id !== id);
    state.compare = state.compare.filter((p) => p !== id);
    state.documents = state.documents.filter((d) => d.paperId !== id);
    if (!(await writeWorkspace(state, revision)))
      return NextResponse.json(
        { error: "Concurrent update. Please retry." },
        { status: 409 },
      );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not remove paper." },
      { status: 503 },
    );
  }
}
