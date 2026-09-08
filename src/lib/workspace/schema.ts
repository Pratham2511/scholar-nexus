import { z } from "zod";
const text = z.string().max(16000);
const url = z
  .string()
  .url()
  .max(2000)
  .refine((v) => /^https?:\/\//i.test(v));
export const paperSchema = z.object({
  id: z.string().min(1).max(500),
  title: z.string().min(1).max(1000),
  authors: z.array(z.string().max(300)).max(500),
  abstract: text,
  year: z.number().int().nullable(),
  doi: z.string().max(500).nullable(),
  pdfLink: url.nullable(),
  citationCount: z.number().nonnegative().nullable(),
  publisher: z.string().max(1000).nullable(),
  sources: z.array(z.string().max(100)).max(20),
  sourceUrls: z.array(z.object({ source: z.string().max(100), url })).max(50),
  keywords: z.array(z.string().max(300)).max(100),
  openAccess: z.boolean().nullable(),
  paperType: z.string().max(100).nullable(),
  venue: z.string().max(1000).nullable(),
  identifiers: z
    .object({
      doi: z.string().optional(),
      arxiv: z.string().optional(),
      pmid: z.string().optional(),
      pmcid: z.string().optional(),
      openalex: z.string().optional(),
      semanticScholar: z.string().optional(),
    })
    .optional(),
  retrievedAt: z.string().optional(),
  integrityNotices: z.array(z.object({kind:z.enum(["retraction","correction"]),source:z.string(),url,retrievedAt:z.string()})).max(20).optional(),
  provenance: z
    .array(
      z.object({
        source: z.string(),
        citationCount: z.number().nullable(),
        retrievedAt: z.string(),
      }),
    )
    .optional(),
  relevanceScore: z.number().optional(),
});
export const fields = [
  "Question",
  "Method",
  "Dataset / sample",
  "Evaluation",
  "Metrics",
  "Findings",
  "Limitations",
  "Code / data",
  "Notes",
] as const;
const evidenceSchema = z.object({
  id: z.string().max(100),
  paperId: z.string().max(500),
  field: z.enum(fields),
  statement: text,
  quote: text,
  kind: z.enum(["author passage", "researcher note"]),
  documentId: z.string().max(100).optional(),
  page: z.number().int().positive().optional(),
  createdAt: z.string(),
});
const memberSchema = z.object({
  paperId: z.string(),
  status: z.enum(["unread", "reading", "read"]).default("unread"),
  decision: z
    .enum(["unscreened", "include", "exclude", "maybe"])
    .default("unscreened"),
  reason: text.default(""),
  notes: text.default(""),
  tags: z.string().max(500).default(""),
});
const projectSchema = z.object({
  id: z.string().max(100),
  name: z.string().min(1).max(200),
  question: text,
  criteria: text,
  members: z.array(memberSchema).max(2000),
  createdAt: z.string(),
});
const searchSchema = z.object({
  id: z.string().max(100),
  query: z.string().max(1000),
  filters: z.record(z.string(), z.unknown()),
  providers: z.array(z.string()),
  createdAt: z.string(),
  papers: z.array(paperSchema).max(200),
  diagnostics: z.array(
    z.object({
      source: z.string(),
      status: z.string().optional(),
      error: z.string().optional(),
      durationMs: z.number(),
    }),
  ),
  coverage: z.string().optional(),
});
const documentSchema = z.object({
  id: z.string().max(100),
  paperId: z.string().max(500),
  name: z.string().max(300),
  hash: z.string().length(64),
  pages: z
    .array(
      z.object({
        page: z.number().int().positive(),
        text: z.string().max(60000),
      }),
    )
    .max(500),
  createdAt: z.string(),
});
const alertSchema = z.object({
  id: z.string().max(100),
  query: z.string().min(1).max(1000),
  filters: z.record(z.string(), z.unknown()),
  providers: z.array(z.string()),
  frequency: z.enum(["daily", "weekly"]),
  lastRunAt: z.string().nullable(),
  seen: z.array(z.string()).max(20000),
  error: z.string().optional(),
  createdAt: z.string(),
});
export const workspaceSchema = z.object({
  version: z.literal(1),
  papers: z.array(paperSchema).max(2000),
  projects: z.array(projectSchema).max(100),
  evidence: z.array(evidenceSchema).max(10000),
  compare: z.array(z.string()).max(8),
  searches: z.array(searchSchema).max(100),
  documents: z.array(documentSchema).max(100),
  alerts: z.array(alertSchema).max(100),
  inbox: z
    .array(
      z.object({
        id: z.string(),
        alertId: z.string(),
        paper: paperSchema,
        discoveredAt: z.string(),
        read: z.boolean(),
      }),
    )
    .max(2000),
  events: z
    .array(
      z.object({
        id: z.string(),
        projectId: z.string(),
        paperId: z.string(),
        before: memberSchema.shape.decision,
        after: memberSchema.shape.decision,
        reason: text,
        createdAt: z.string(),
      }),
    )
    .max(20000),
});
export type Workspace = z.infer<typeof workspaceSchema>;
export type Project = Workspace["projects"][number];
export type Evidence = Workspace["evidence"][number];
export type DocumentRecord = Workspace["documents"][number];
export const emptyWorkspace = (): Workspace => ({
  version: 1,
  papers: [],
  projects: [],
  evidence: [],
  compare: [],
  searches: [],
  documents: [],
  alerts: [],
  inbox: [],
  events: [],
});
export function validateEvidence(state: Workspace): string | null {
  for (const e of state.evidence) {
    const paper = state.papers.find((p) => p.id === e.paperId);
    if (!paper) return "Evidence must belong to a saved paper.";
    if (e.kind === "researcher note") continue;
    if (e.statement !== e.quote)
      return "Author passages must be verbatim; save interpretations as researcher notes.";
    const doc = state.documents.find(
      (d) => d.id === e.documentId && d.paperId === e.paperId,
    );
    const source = e.documentId
      ? doc?.pages.find((p) => p.page === e.page)?.text
      : paper.abstract;
    if (!e.quote.trim() || !source?.includes(e.quote))
      return "An author passage must quote the available abstract or selected PDF page exactly.";
  }
  return null;
}
