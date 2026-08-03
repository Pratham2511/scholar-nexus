import type { AcademicPaper } from "../types";
import { normalizeText, safeNumber, truncate, buildId, extractKeywords } from "../utils";

interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

interface CrossrefItem {
  DOI?: string;
  title?: string[];
  "container-title"?: string[];
  "published-print"?: { "date-parts"?: number[][] };
  "published-online"?: { "date-parts"?: number[][] };
  created?: { "date-parts"?: number[][] };
  issued?: { "date-parts"?: number[][] };
  author?: CrossrefAuthor[];
  "is-referenced-by-count"?: number;
  abstract?: string;
  "publisher"?: string;
  "type"?: string;
  link?: { URL?: string; "content-type"?: string }[];
  license?: { URL?: string; start?: { "date-parts"?: number[][] } }[];
  subject?: string[];
  "short-container-title"?: string[];
}

interface CrossrefResponse {
  message?: {
    items?: CrossrefItem[];
    "total-results"?: number;
  };
  error?: string;
}

/**
 * Search Crossref's works endpoint.
 * Docs: https://api.crossref.org/swagger-ui/index.html
 */
export async function searchCrossref(
  query: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<AcademicPaper[]> {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", query);
  url.searchParams.set("rows", String(Math.min(limit, 50)));
  url.searchParams.set("select", "DOI,title,author,abstract,published-print,published-online,issued,created,is-referenced-by-count,publisher,type,link,license,subject,container-title,short-container-title");
  url.searchParams.set("sort", "is-referenced-by-count");
  url.searchParams.set("order", "desc");
  url.searchParams.set("mailto", "research-assistant@example.com");

  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ResearchAssistant/1.0 (mailto:research-assistant@example.com)" },
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Crossref HTTP ${res.status}: ${truncate(text, 200)}`);
  }

  const json = (await res.json()) as CrossrefResponse;
  if (json.error) throw new Error(`Crossref error: ${json.error}`);

  const items = json.message?.items || [];
  return items.map((item) => mapCrossrefItem(item));
}

function mapCrossrefItem(item: CrossrefItem): AcademicPaper {
  const title = normalizeText(item.title?.[0]) || "Untitled";
  const abstractRaw = normalizeText(item.abstract) || "";
  // Crossref wraps abstracts in <jats:p> tags; strip them.
  const abstract = abstractRaw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "No abstract available.";
  const year = pickYear(item);
  const doi = item.DOI ?? null;
  const pdfLink = item.link?.find((l) => l["content-type"] === "application/pdf")?.URL ||
    item.link?.[0]?.URL ||
    null;
  const publisher = item.publisher || item["container-title"]?.[0] || null;
  const licenseStart = item.license?.[0]?.start?.["date-parts"]?.[0]?.[0];
  const isOpen = !!item.license?.some((l) => /creativecommons|open access|unrestricted/i.test(l.URL || ""));
  const sourceUrl = doi ? `https://doi.org/${doi}` : null;

  return {
    id: buildId("crossref", doi || title.slice(0, 60)),
    title,
    authors: (item.author || []).map((a) => a.name || [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean),
    abstract,
    year,
    doi,
    pdfLink,
    citationCount: safeNumber(item["is-referenced-by-count"], 0),
    publisher,
    sources: ["Crossref"],
    sourceUrls: sourceUrl ? [{ source: "Crossref", url: sourceUrl }] : [],
    keywords: (item.subject || []).slice(0, 8).map((s) => s.toLowerCase()),
    openAccess: isOpen,
    paperType: item.type || null,
    venue: item["container-title"]?.[0] || item["short-container-title"]?.[0] || null,
  };
}

function pickYear(item: CrossrefItem): number | null {
  const candidates = [
    item["published-print"]?.["date-parts"]?.[0]?.[0],
    item["published-online"]?.["date-parts"]?.[0]?.[0],
    item.issued?.["date-parts"]?.[0]?.[0],
    item.created?.["date-parts"]?.[0]?.[0],
  ];
  for (const c of candidates) {
    if (typeof c === "number") return c;
  }
  return null;
}
