import type { AcademicPaper } from "../types";
import { normalizeText, safeNumber, truncate, buildId } from "../utils";

interface OpenAlexAuthorship {
  author?: { display_name?: string; id?: string };
}

interface OpenAlexLocation {
  source?: { display_name?: string };
  pdf_url?: string;
  landing_page_url?: string;
  is_oa?: boolean;
}

interface OpenAlexConcept {
  display_name?: string;
  score?: number;
}

interface OpenAlexWork {
  id?: string;
  title?: string;
  display_name?: string;
  authorships?: OpenAlexAuthorship[];
  publication_year?: number;
  doi?: string;
  abstract_inverted_index?: Record<string, number[]>;
  cited_by_count?: number;
  primary_location?: OpenAlexLocation;
  best_oa_location?: OpenAlexLocation;
  open_access?: { is_oa?: boolean };
  concepts?: OpenAlexConcept[];
  type?: string;
}

interface OpenAlexResponse {
  meta?: { count?: number };
  results?: OpenAlexWork[];
  error?: string;
}

/**
 * Reconstruct an abstract from OpenAlex's inverted index format.
 * The inverted index maps each word → list of positions where it appears.
 * We flatten all (position, word) pairs, sort by position, and join.
 */
function reconstructAbstract(inverted: Record<string, number[]> | undefined): string {
  if (!inverted) return "";
  const pairs: { pos: number; word: string }[] = [];
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) pairs.push({ pos, word });
  }
  pairs.sort((a, b) => a.pos - b.pos);
  return pairs.map((p) => p.word).join(" ");
}

const TYPE_MAP: Record<string, string> = {
  "journal-article": "Journal Article",
  "proceedings-article": "Conference Paper",
  "book-chapter": "Book Chapter",
  "book": "Book",
  "preprint": "Preprint",
  "report": "Report",
  "dissertation": "Thesis",
  "dataset": "Dataset",
  "review": "Review Article",
  "editorial": "Editorial",
  "letter": "Letter",
};

/**
 * Search OpenAlex — 474M+ works, no API key required.
 * Docs: https://docs.openalex.org/api-entities/works/search-works
 * Add mailto to join the polite pool (faster responses).
 */
export async function searchOpenAlex(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<AcademicPaper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("sort", "cited_by_count:desc");
  url.searchParams.set("per_page", String(Math.min(limit, 50)));
  url.searchParams.set(
    "select",
    "id,title,display_name,authorships,publication_year,doi,abstract_inverted_index,cited_by_count,primary_location,best_oa_location,open_access,concepts,type",
  );
  // Polite pool: include mailto
  url.searchParams.set("mailto", "scholarai@research.local");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ScholarAI/2.0 (mailto:scholarai@research.local)",
    },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) {
      console.warn("[OpenAlex] rate-limited (HTTP 429), skipping source.");
      return [];
    }
    throw new Error(`OpenAlex HTTP ${res.status}: ${truncate(text, 200)}`);
  }

  const json = (await res.json()) as OpenAlexResponse;
  if (json.error) throw new Error(`OpenAlex error: ${json.error}`);

  const results = json.results || [];
  return results.map((w) => mapOpenAlexWork(w));
}

function mapOpenAlexWork(w: OpenAlexWork): AcademicPaper {
  const title = normalizeText(w.title || w.display_name) || "Untitled";
  const abstractRaw = reconstructAbstract(w.abstract_inverted_index);
  const abstract = normalizeText(abstractRaw) || "No abstract available.";
  const year = typeof w.publication_year === "number" ? w.publication_year : null;
  // OpenAlex returns DOI as full URL "https://doi.org/10.xxxx/..." — strip the prefix
  const doiRaw = w.doi ?? null;
  const doi = doiRaw ? doiRaw.replace(/^https?:\/\/doi\.org\//i, "") : null;
  const pdfLink =
    w.best_oa_location?.pdf_url ||
    w.primary_location?.landing_page_url ||
    null;
  const sourceName = "OpenAlex";
  const openAlexId = w.id?.split("/").pop() || null;
  const sourceUrl = w.id || (openAlexId ? `https://openalex.org/${openAlexId}` : null);
  const publisher = w.primary_location?.source?.display_name || null;
  const concepts = (w.concepts || [])
    .filter((c) => c.display_name)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map((c) => (c.display_name || "").toLowerCase());

  return {
    id: buildId("openalex", openAlexId || doi || title.slice(0, 60)),
    title,
    authors: (w.authorships || [])
      .map((a) => a.author?.display_name || "")
      .filter(Boolean),
    abstract,
    year,
    doi,
    pdfLink,
    citationCount: safeNumber(w.cited_by_count, 0),
    publisher,
    sources: [sourceName],
    sourceUrls: sourceUrl ? [{ source: sourceName, url: sourceUrl }] : [],
    keywords: concepts,
    openAccess: !!w.open_access?.is_oa,
    paperType: w.type ? (TYPE_MAP[w.type] || w.type) : null,
    venue: publisher,
  };
}
