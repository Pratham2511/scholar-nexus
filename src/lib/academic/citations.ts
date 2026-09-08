import type { AcademicPaper, AuthorProfile, CitationGraph, CitationNeighbor } from "./types";
import { providerFetch } from "./http";
export async function fetchCitationGraph(
  paperId: string,
  paperTitle: string,
  type: "refs" | "cites",
): Promise<CitationGraph | { refsOrCites: CitationNeighbor[]; type: "refs" | "cites" }> {
  const s2Id = paperId.replace(/^ss--/, '');
  if (!/^(?:[0-9a-fA-F]{40}|DOI:10\.|ARXIV:|PMID:)/i.test(s2Id)) throw new Error('This paper has no supported stable citation identifier. Open a provider record instead.');

  const endpoint = type === "refs" ? "references" : "citations";
  const url = `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(s2Id)}/${endpoint}?fields=title,authors,year,citationCount,abstract,externalIds,openAccessPdf,venue&limit=20`;

  const res = await providerFetch(url, {
    headers: { Accept: "application/json", ...(process.env.SEMANTIC_SCHOLAR_API_KEY ? { "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY } : {}) }, signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Citation provider HTTP ${res.status}`);

  const json = (await res.json()) as {
    data?: Array<{
      citedPaper?: {
        paperId?: string;
        title?: string;
        authors?: { name?: string }[];
        year?: number;
        citationCount?: number;
        abstract?: string;
        externalIds?: { DOI?: string };
        openAccessPdf?: { url?: string };
        venue?: string;
      };
      // For /citations, the actual paper is nested under "citingPaper"
      citingPaper?: {
        paperId?: string;
        title?: string;
        authors?: { name?: string }[];
        year?: number;
        citationCount?: number;
        abstract?: string;
        externalIds?: { DOI?: string };
        openAccessPdf?: { url?: string };
        venue?: string;
      };
    }>;
  };

  const data = json.data || [];
  const neighbors: CitationNeighbor[] = data
    .map((entry) => {
      const p = type === "refs" ? entry.citedPaper : entry.citingPaper;
      if (!p || !p.title) return null;
      return {
        paperId: p.paperId || "",
        title: p.title,
        authors: (p.authors || []).map((a) => a.name || "").filter(Boolean),
        year: typeof p.year === "number" ? p.year : null,
        citationCount: p.citationCount || 0,
        abstract: p.abstract || "No abstract available.",
        doi: p.externalIds?.DOI || null,
        openAccessPdf: p.openAccessPdf?.url || null,
        venue: p.venue || null,
      } as CitationNeighbor;
    })
    .filter((n): n is CitationNeighbor => n !== null);

  return type === "refs"
    ? { references: neighbors, citations: [] }
    : { references: [], citations: neighbors };
}

export async function fetchAuthorProfile(name: string): Promise<AuthorProfile> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/author/search");
  url.searchParams.set("query", name);
  url.searchParams.set(
    "fields",
    "name,affiliations,paperCount,citationCount,hIndex,papers.title,papers.year,papers.citationCount,papers.abstract,papers.externalIds,papers.openAccessPdf,papers.venue",
  );
  url.searchParams.set("limit", "1");

  const res = await providerFetch(url, { headers: { Accept: "application/json", ...(process.env.SEMANTIC_SCHOLAR_API_KEY ? { "x-api-key": process.env.SEMANTIC_SCHOLAR_API_KEY } : {}) }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Semantic Scholar is rate-limiting author searches. Please try again in a minute.");
    }
    throw new Error(`Author search failed: HTTP ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: Array<{
      name?: string;
      authorId?: string;
      affiliations?: string[];
      paperCount?: number;
      citationCount?: number;
      hIndex?: number;
      papers?: Array<{
        title?: string;
        year?: number;
        citationCount?: number;
        abstract?: string;
        externalIds?: { DOI?: string };
        openAccessPdf?: { url?: string };
        venue?: string;
        paperId?: string;
      }>;
    }>;
  };

  const author = json.data?.[0];
  if (!author) {
    return {
      name,
      affiliations: [],
      paperCount: 0,
      citationCount: 0,
      hIndex: null,
      papers: [],
    };
  }

  const papers: AcademicPaper[] = (author.papers || []).slice(0, 20).map((p, i) => ({
    id: p.paperId || `s2-author-${i}`,
    title: p.title || "Untitled",
    authors: [author.name || name],
    abstract: p.abstract || "No abstract available.",
    year: typeof p.year === "number" ? p.year : null,
    doi: p.externalIds?.DOI || null,
    pdfLink: p.openAccessPdf?.url || null,
    citationCount: p.citationCount || 0,
    publisher: p.venue || null,
    sources: ["Semantic Scholar"],
    sourceUrls: p.paperId ? [{ source: "Semantic Scholar", url: `https://www.semanticscholar.org/paper/${p.paperId}` }] : [],
    keywords: [],
    openAccess: !!p.openAccessPdf?.url,
    paperType: null,
    venue: p.venue || null,
  }));

  return {
    name: author.name || name,
    authorId: author.authorId,
    affiliations: author.affiliations || [],
    paperCount: author.paperCount || 0,
    citationCount: author.citationCount || 0,
    hIndex: author.hIndex ?? null,
    papers,
  };
}
