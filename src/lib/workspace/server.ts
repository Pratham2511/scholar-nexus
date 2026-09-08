import { db } from "@/lib/db";
import { ensureLocalUser, getLocalUserId } from "@/lib/user";
import { emptyWorkspace, workspaceSchema, type Workspace } from "./schema";
export async function readWorkspace() {
  const existing = await db.researchWorkspace.findUnique({
    where: { id: getLocalUserId() },
  });
  if (existing)
    return {
      revision: existing.revision,
      state: workspaceSchema.parse(JSON.parse(existing.data)),
    };
  await ensureLocalUser();
  const state = emptyWorkspace();
  const saved = await db.savedPaper.findMany({
    where: { userId: getLocalUserId() },
  });
  state.papers = saved.map((p) =>
    p.metadata
      ? JSON.parse(p.metadata)
      : {
          id: p.paperId,
          title: p.title,
          authors: p.authors.split("|||").filter(Boolean),
          abstract: p.abstract || "",
          year: p.year,
          doi: p.doi,
          pdfLink: p.pdfLink,
          citationCount: p.citationCount,
          publisher: p.publisher,
          sources: p.source ? [p.source] : [],
          sourceUrls: p.doi
            ? [{ source: "DOI", url: `https://doi.org/${p.doi}` }]
            : [],
          keywords: p.keywords?.split("|||").filter(Boolean) || [],
          openAccess: p.openAccess,
          paperType: null,
          venue: p.publisher,
        },
  );
  const collections = await db.collection.findMany({
    where: { userId: getLocalUserId() },
    include: { papers: true },
  });
  state.projects = collections.map((c) => ({
    id: c.id,
    name: c.name,
    question: c.description || "",
    criteria: "",
    createdAt: c.createdAt.toISOString(),
    members: c.papers.map((p) => ({
      paperId: p.paperId,
      status: "unread" as const,
      decision: "unscreened" as const,
      reason: "",
      notes: p.notes || "",
      tags: "",
    })),
  }));
  const alerts = await db.searchAlert.findMany({
    where: { userId: getLocalUserId() },
  });
  state.alerts = alerts.map((a) => ({
    id: a.id,
    query: a.query,
    filters: JSON.parse(a.filters),
    providers: ["Crossref", "arXiv", "Europe PMC"],
    frequency: a.frequency === "daily" ? "daily" : "weekly",
    lastRunAt: a.lastRunAt?.toISOString() || null,
    seen: [],
    createdAt: a.createdAt.toISOString(),
  }));
  const row = await db.researchWorkspace.upsert({
    where: { id: getLocalUserId() },
    create: { id: getLocalUserId(), data: JSON.stringify(state) },
    update: {},
  });
  return {
    revision: row.revision,
    state: workspaceSchema.parse(JSON.parse(row.data)),
  };
}
export async function writeWorkspace(state: Workspace, revision: number) {
  const result = await db.researchWorkspace.updateMany({
    where: { id: getLocalUserId(), revision },
    data: { data: JSON.stringify(state), revision: { increment: 1 } },
  });
  return result.count === 1;
}
