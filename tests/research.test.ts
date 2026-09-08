import test from "node:test";
import assert from "node:assert/strict";
import { prepareQuery, identifier } from "../src/lib/academic/query";
import { deduplicatePapers } from "../src/lib/academic/dedup";
import { applyFilters, rankPapers } from "../src/lib/academic/rank";
import {
  searchMultipleSources,
  PROVIDERS,
} from "../src/lib/academic/orchestrator";
import { providerFetch, ProviderError } from "../src/lib/academic/http";
import {
  emptyWorkspace,
  validateEvidence,
  workspaceSchema,
} from "../src/lib/workspace/schema";
import { bibliography, csv } from "../src/lib/workspace/exports";
import {
  groundedQuotes,
  matchingPassages,
} from "../src/lib/workspace/grounding";
import { searchCrossref } from "../src/lib/academic/sources/crossref";
import { searchArxiv } from "../src/lib/academic/sources/arxiv";
import { fetchCitationGraph } from "../src/lib/academic/citations";
import type { AcademicPaper } from "../src/lib/academic/types";
const paper = (changes: Partial<AcademicPaper> = {}): AcademicPaper => ({
  id: "paper-1",
  title: "Graph neural networks for molecular prediction",
  authors: ["A Researcher"],
  abstract:
    "We evaluated graph networks using 120 molecules. Accuracy was 82% on the held-out set.",
  year: 2025,
  doi: "10.1000/test",
  pdfLink: null,
  citationCount: null,
  publisher: null,
  sources: ["Crossref"],
  sourceUrls: [{ source: "Crossref", url: "https://doi.org/10.1000/test" }],
  keywords: [],
  openAccess: null,
  paperType: "article",
  venue: null,
  ...changes,
});
test("baseline preserves exact query, explicit filters and exclusions with AI disabled", () => {
  process.env.AI_ENABLED = "false";
  const f = {
    yearFrom: 2025,
    openAccessOnly: false,
    excludeKeywords: ["survey"],
  };
  const q = prepareQuery('"graph attention" NOT survey', f);
  assert.deepEqual(q.searchTerms, ['"graph attention" NOT survey']);
  assert.deepEqual(q.filters, f);
  assert.notEqual(q.filters, f);
});
test("recognizes DOI URLs and arXiv versions without truncating them", () => {
  assert.deepEqual(identifier("https://doi.org/10.1000/ABC"), {
    kind: "doi",
    value: "10.1000/abc",
  });
  assert.deepEqual(identifier("arXiv:1706.03762v7"), {
    kind: "arxiv",
    value: "1706.03762v7",
  });
  assert.equal(identifier("graph neural networks"), null);
});
test("dedup uses normalized DOI and does not mutate source snapshots", () => {
  const a = paper({ id: "a" }),
    b = paper({
      id: "b",
      doi: "https://doi.org/10.1000/TEST",
      sources: ["Europe PMC"],
    });
  const d = deduplicatePapers([a, b]);
  assert.equal(d.papers.length, 1);
  assert.equal(d.papers[0].id, "doi:10.1000/test");
  assert.equal(d.papers[0].sources.length, 2);
  assert.deepEqual(a.sources, ["Crossref"]);
});
test("dedup does not merge distinct DOI works or preprints by title", () => {
  assert.equal(
    deduplicatePapers([paper(), paper({ id: "2", doi: "10.1000/different" })])
      .papers.length,
    2,
  );
  assert.equal(
    deduplicatePapers([
      paper(),
      paper({ id: "2", doi: null, paperType: "preprint" }),
    ]).papers.length,
    2,
  );
});
test("dedup result is independent of arrival order", () => {
  const p = [
    paper({ id: "a", doi: null }),
    paper({ id: "b" }),
    paper({ id: "c", doi: "10.1000/test", citationCount: 45 }),
  ];
  assert.deepEqual(deduplicatePapers(p), deduplicatePapers([...p].reverse()));
  assert.equal(deduplicatePapers(p).papers.length, 1);
});
test("unknown metadata cannot pass strict year, citation or access filters", () => {
  assert.equal(
    applyFilters([paper({ year: null })], { yearFrom: 2020 }).length,
    0,
  );
  assert.equal(applyFilters([paper()], { minCitations: 1 }).length, 0);
  assert.equal(applyFilters([paper()], { openAccessOnly: true }).length, 0);
  assert.equal(applyFilters([paper()], {}).length, 1);
});
test("a famous off-topic paper cannot outrank an exact title", () => {
  const q = prepareQuery(paper().title);
  const ranked = rankPapers(
    [
      paper({
        id: "wrong",
        title: "A different field",
        abstract: "Unrelated science",
        citationCount: 1000000,
        publisher: "Nature",
      }),
      paper(),
    ],
    q,
  );
  assert.equal(ranked[0].id, "paper-1");
});
test("one source failure returns partial real records; all failures are an error", async () => {
  const old = PROVIDERS.Crossref.search;
  try {
    PROVIDERS.Crossref.search = async () => [paper()];
    const result = await searchMultipleSources(prepareQuery("graph"), {
      sources: ["Crossref", "Unavailable"],
    });
    assert.equal(result.papers.length, 1);
    assert.equal(result.sources[1].status, "unconfigured");
    assert.equal(result.error, undefined);
    PROVIDERS.Crossref.search = async () => {
      throw new Error("outage");
    };
    const failed = await searchMultipleSources(prepareQuery("graph"), {
      sources: ["Crossref"],
    });
    assert.equal(failed.papers.length, 0);
    assert.ok(failed.error);
    assert.equal(failed.sources[0].status, "failed");
  } finally {
    PROVIDERS.Crossref.search = old;
  }
});
test("a provider timeout aborts underlying work and has a typed status", async () => {
  const old = PROVIDERS.Crossref.search;
  let aborted = false;
  try {
    PROVIDERS.Crossref.search = async (_q, _l, signal) =>
      new Promise((_resolve, reject) =>
        signal?.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(signal.reason);
          },
          { once: true },
        ),
      );
    const start = Date.now();
    const result = await searchMultipleSources(prepareQuery("graph"), {
      sources: ["Crossref"],
      timeoutMs: 30,
      overallTimeoutMs: 60,
    });
    assert.ok(aborted);
    assert.equal(result.sources[0].status, "timeout");
    assert.ok(Date.now() - start < 500);
  } finally {
    PROVIDERS.Crossref.search = old;
  }
});
test("429 with Retry-After is not a successful empty result", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("{}", { status: 429, headers: { "Retry-After": "60" } });
  try {
    await assert.rejects(
      () => providerFetch("https://rate-limit-test.invalid"),
      (e) => e instanceof ProviderError && e.status === 429,
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("transient 503 retries once then succeeds", async () => {
  const original = globalThis.fetch;
  let count = 0;
  globalThis.fetch = async () =>
    new Response("{}", { status: ++count === 1 ? 503 : 200 });
  try {
    assert.equal(
      (await providerFetch("https://retry-test.invalid")).status,
      200,
    );
    assert.equal(count, 2);
  } finally {
    globalThis.fetch = original;
  }
});
test("Crossref contract: relevance order, upstream year filters, no HTML PDF fallback", async () => {
  const original = globalThis.fetch;
  let request: URL | undefined;
  globalThis.fetch = async (url) => {
    request = new URL(String(url));
    return Response.json({
      message: {
        items: [
          {
            DOI: "10.1000/test",
            title: ["Test"],
            link: [
              { URL: "https://example.org/html", "content-type": "text/html" },
            ],
          },
        ],
      },
    });
  };
  try {
    const result = await searchCrossref(
      "graph",
      20,
      AbortSignal.timeout(5000),
      { yearFrom: 2024 },
    );
    assert.equal(request!.searchParams.get("sort"), "relevance");
    assert.match(request!.searchParams.get("filter")!, /2024/);
    assert.equal(result[0].pdfLink, null);
    assert.equal(result[0].citationCount, null);
  } finally {
    globalThis.fetch = original;
  }
});
test("malformed Crossref payload is an error", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ unexpected: true });
  try {
    await assert.rejects(
      () => searchCrossref("graph", 20, AbortSignal.timeout(5000)),
      /Malformed/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("arXiv quoted phrase remains intact and PDF link is a PDF", async () => {
  const original = globalThis.fetch;
  let request: URL | undefined;
  globalThis.fetch = async (url) => {
    request = new URL(String(url));
    return new Response(
      '<feed><entry><id>http://arxiv.org/abs/1706.03762v7</id><title>Attention Is All You Need</title><summary>Text.</summary><link href="http://arxiv.org/pdf/1706.03762v7" rel="related" type="application/pdf"/></entry></feed>',
    );
  };
  try {
    const result = await searchArxiv(
      '"Attention Is All You Need"',
      1,
      AbortSignal.timeout(5000),
    );
    assert.equal(
      request!.searchParams.get("search_query"),
      'all:"Attention Is All You Need"',
    );
    assert.match(result[0].pdfLink!, /\/pdf\//);
    assert.equal(result[0].identifiers?.arxiv, "1706.03762");
  } finally {
    globalThis.fetch = original;
  }
});
test("citation references use citedPaper and preserve seed DOI identity", async () => {
  const original = globalThis.fetch;
  let requested = "";
  globalThis.fetch = async (url) => {
    requested = String(url);
    return Response.json({
      data: [
        {
          citedPaper: {
            paperId: "neighbor",
            title: "Actual reference",
            year: 2022,
          },
        },
      ],
    });
  };
  try {
    const graph = await fetchCitationGraph("DOI:10.1000/test", "Seed", "refs");
    assert.ok("references" in graph);
    if ("references" in graph)
      assert.equal(graph.references[0].title, "Actual reference");
    assert.match(requested, /DOI%3A10/);
  } finally {
    globalThis.fetch = original;
  }
});
test("citation lookup never guesses a first title match", async () => {
  await assert.rejects(
    () => fetchCitationGraph("unknown-local-id", "Ambiguous title", "refs"),
    /stable citation identifier/,
  );
});
test("source evidence must match the exact document and page", () => {
  const s = emptyWorkspace();
  s.papers = [paper()];
  s.evidence = [
    {
      id: "e",
      paperId: "paper-1",
      field: "Findings",
      statement: "Accuracy was 82%",
      quote: "Accuracy was 82%",
      kind: "author passage",
      createdAt: new Date().toISOString(),
    },
  ];
  assert.equal(validateEvidence(s), null);
  s.evidence[0].quote = "Accuracy was 99%";
  s.evidence[0].statement = "Accuracy was 99%";
  assert.match(validateEvidence(s)!, /exactly/);
  s.evidence[0].kind = "researcher note";
  assert.equal(validateEvidence(s), null);
});
test("Q&A rejects invented quotations and wrong page references", () => {
  const pages = [
    { page: 2, text: "We evaluated 120 molecules in the held-out set." },
  ];
  assert.equal(
    groundedQuotes([{ page: 1, text: pages[0].text }], pages).length,
    0,
  );
  assert.equal(
    groundedQuotes([{ page: 2, text: "We evaluated 999 molecules." }], pages)
      .length,
    0,
  );
  assert.equal(groundedQuotes(pages, pages).length, 1);
  assert.equal(matchingPassages(pages, "quantum entanglement").length, 0);
});
test("bibliography output escapes BibTeX syntax and RIS has typed boundaries", () => {
  const p = paper({ title: "A {study} & 10% improvement" });
  const bib = bibliography([p], "bib");
  assert.match(bib, /\\\{study\\\}/);
  assert.match(bib, /\\&/);
  const ris = bibliography([p], "ris");
  assert.match(ris, /^TY  - JOUR/);
  assert.match(ris, /ER  - $/);
  assert.match(ris, /DO  - 10.1000\/test/);
});
test("CSV quotes commas and quotes, and neutralizes spreadsheet formulas", () => {
  const value = csv([["=1+1", "a,b", 'He said "yes"']]);
  assert.equal(value, '\ufeff"\'=1+1","a,b","He said ""yes"""');
});
test("workspace schema rejects oversized or malformed state", () => {
  assert.ok(workspaceSchema.safeParse(emptyWorkspace()).success);
  assert.equal(
    workspaceSchema.safeParse({
      ...emptyWorkspace(),
      compare: Array(9).fill("paper"),
    }).success,
    false,
  );
});
test("canceling a queued request respects its deadline without opening another connection", async () => {
  const original = globalThis.fetch;
  let release!: () => void;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return Response.json({});
  };
  try {
    const first = providerFetch("https://queue-test.invalid", {});
    await new Promise((resolve) => setTimeout(resolve, 10));
    // A real pending fetch keeps the process alive; this mock has no socket.
    // Use a referenced timer so Node 22 does not exit before cancellation fires.
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(new Error("Test deadline")), 20);
    try {
      await assert.rejects(() =>
        providerFetch("https://queue-test.invalid", { signal: controller.signal }),
      );
    } finally {
      clearTimeout(deadline);
    }
    assert.equal(calls, 1);
    release();
    await first;
  } finally {
    globalThis.fetch = original;
  }
});
test("preprint and published records sharing a DOI retain different canonical IDs", () => {
  const d = deduplicatePapers([
    paper(),
    paper({
      id: "preprint",
      paperType: "preprint",
      identifiers: { arxiv: "2501.00001" },
    }),
  ]);
  assert.equal(d.papers.length, 2);
  assert.equal(new Set(d.papers.map((p) => p.id)).size, 2);
});
