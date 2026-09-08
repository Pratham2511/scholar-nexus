import test from "node:test";
import assert from "node:assert/strict";
import { emptyWorkspace } from "../src/lib/workspace/schema";
import { applyAlertResult } from "../src/lib/workspace/alerts";
import { prepareQuery } from "../src/lib/academic/query";
import type { AcademicPaper, SearchResult } from "../src/lib/academic/types";
const paper: AcademicPaper = {
  id: "doi:10.1000/old",
  doi: "10.1000/old",
  title: "An older newly discovered record",
  abstract: "",
  authors: [],
  year: 2001,
  pdfLink: null,
  citationCount: null,
  publisher: null,
  sources: ["Crossref"],
  sourceUrls: [],
  keywords: [],
  openAccess: null,
  paperType: null,
  venue: null,
};
const result = (papers: AcademicPaper[], error?: string): SearchResult => ({
  papers,
  error,
  sources: [
    {
      source: "Crossref",
      success: !error,
      status: error ? "failed" : "success",
      papers: [],
      durationMs: 10,
    },
  ],
  understoodQuery: prepareQuery("graph"),
  totalFound: papers.length,
  duplicatesRemoved: 0,
  durationMs: 10,
});
test("alert baseline persists through serialization; repeated checks do not notify twice", () => {
  let s = emptyWorkspace();
  s.alerts.push({
    id: "a",
    query: "graph",
    filters: {},
    providers: ["Crossref"],
    frequency: "daily",
    lastRunAt: null,
    seen: [],
    createdAt: "2026-09-08T00:00:00Z",
  });
  applyAlertResult(s, "a", result([]), "2026-09-08T00:00:00Z");
  assert.equal(s.inbox.length, 0);
  s = JSON.parse(JSON.stringify(s));
  applyAlertResult(s, "a", result([paper]), "2026-09-09T00:00:00Z");
  assert.equal(s.inbox.length, 1);
  assert.equal(s.inbox[0].paper.year, 2001);
  s = JSON.parse(JSON.stringify(s));
  applyAlertResult(s, "a", result([paper]), "2026-09-10T00:00:00Z");
  assert.equal(s.inbox.length, 1);
});
test("failed alert checks do not establish a baseline or erase seen records", () => {
  const s = emptyWorkspace();
  s.alerts.push({
    id: "a",
    query: "graph",
    filters: {},
    providers: ["Crossref"],
    frequency: "daily",
    lastRunAt: null,
    seen: [],
    createdAt: "2026-09-08T00:00:00Z",
  });
  applyAlertResult(s, "a", result([], "Outage"), "2026-09-08T00:00:00Z");
  assert.equal(s.alerts[0].seen.length, 0);
  assert.equal(s.alerts[0].error, "Outage");
  applyAlertResult(s, "a", result([paper]), "2026-09-09T00:00:00Z");
  assert.equal(s.inbox.length, 0);
  assert.ok(s.alerts[0].seen.includes(paper.id));
});
