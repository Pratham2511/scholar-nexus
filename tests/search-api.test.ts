import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/search/route";
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/search", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
test("API validates ranges, preserves input, coalesces requests and pages without duplicates", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({
      message: {
        items: Array.from({ length: 25 }, (_, i) => ({
          DOI: `10.1000/${i}`,
          title: [`Graph neural networks ${i}`],
          author: [{ family: "Researcher" }],
          issued: { "date-parts": [[2025]] },
        })),
      },
    });
  };
  try {
    assert.equal(
      (
        await POST(
          request({
            query: "graph",
            filters: { yearFrom: 2026, yearTo: 2020 },
          }),
        )
      ).status,
      400,
    );
    assert.equal((await POST(request(null))).status, 400);
    const body = {
      query: "graph api fixture",
      sources: ["Crossref"],
      filters: { yearFrom: 2025 },
      limit: 10,
    };
    const [a, b] = await Promise.all([
      POST(request(body)),
      POST(request(body)),
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(calls, 1);
    const first = await a.json();
    assert.equal(first.papers.length, 10);
    assert.ok(first.cursor);
    assert.equal(first.understoodQuery.filters.yearFrom, 2025);
    const second = await (
      await POST(request({ ...body, cursor: first.cursor }))
    ).json();
    assert.equal(second.papers.length, 10);
    assert.equal(
      new Set([...first.papers, ...second.papers].map((p) => p.id)).size,
      20,
    );
    assert.equal(
      (await POST(request({ ...body, query: "changed", cursor: first.cursor })))
        .status,
      410,
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("all source failures return 503 and retain diagnostics", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("{}", { status: 429, headers: { "retry-after": "60" } });
  try {
    const response = await POST(
      request({ query: "all source error fixture", sources: ["Crossref"] }),
    );
    assert.equal(response.status, 503);
    const d = await response.json();
    assert.equal(d.sources[0].status, "rate-limited");
    assert.deepEqual(d.papers, []);
    assert.ok(d.error);
  } finally {
    globalThis.fetch = original;
  }
});
