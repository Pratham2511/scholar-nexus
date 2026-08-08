import ZAI from "z-ai-web-dev-sdk";
import type { AIUnderstoodQuery, EvidenceSynthesis, PaperInsights, SearchFilters, AcademicPaper, AuthorProfile, CitationGraph, CitationNeighbor } from "../academic/types";

let zaiInstance: ZAI | null = null;

async function getZAI(): Promise<ZAI> {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

/**
 * Ask the LLM to interpret a natural-language research query and
 * return structured search parameters.
 */
export async function understandQuery(
  rawQuery: string,
  filters: SearchFilters,
): Promise<AIUnderstoodQuery> {
  const zai = await getZAI();

  const systemPrompt = `You are an expert academic research assistant. Your job is to analyze a user's research query in natural language and convert it into a structured search plan for multi-source academic search.

You MUST respond with ONLY a valid JSON object (no markdown fences, no commentary). The JSON schema is:
{
  "topic": "the main research topic (concise, 2-6 words)",
  "intent": "1-2 sentence description of what the user is trying to find",
  "keywords": ["core keywords to search for, 3-8 items"],
  "excludeKeywords": ["keywords to exclude, may be empty"],
  "searchTerms": ["1-3 alternative search term strings to try across sources"],
  "filters": {
    "yearFrom": number_or_null,
    "yearTo": number_or_null,
    "author": "string_or_null",
    "publisher": "string_or_null",
    "minCitations": number_or_null,
    "openAccessOnly": boolean,
    "includeKeywords": ["array_of_strings"],
    "excludeKeywords": ["array_of_strings"],
    "paperType": "string_or_null (e.g. 'Journal Article', 'Conference Paper', 'Review', 'exclude:Review')"
  },
  "reasoning": "1-2 sentences explaining your interpretation"
}

Rules:
- Preserve any explicit filter values the user provided (year ranges, citation thresholds, publishers, etc).
- If the user said "no survey papers" or "exclude reviews", set paperType to "exclude:Review".
- If the user mentioned "open access", set openAccessOnly to true.
- Keep keywords lowercase and remove stop words.
- searchTerms should be variations of the topic suitable for keyword-based search engines.
- NEVER include markdown, NEVER wrap JSON in code fences.`;

  const userPrompt = `User query: "${rawQuery}"

Explicit filters provided by the user:
${JSON.stringify(filters, null, 2)}

Current year: ${new Date().getFullYear()}

Analyze this query and return the structured JSON.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const content = extractContent(completion);
    const parsed = parseJsonLoose(content);

    if (!parsed) {
      // Fall back to a deterministic heuristic if LLM failed to return JSON.
      return heuristicUnderstand(rawQuery, filters);
    }

    // Merge with user-provided filters (user filters take precedence)
    const mergedFilters: SearchFilters = {
      ...filters,
      ...Object.fromEntries(
        Object.entries(parsed.filters || {}).filter(([, v]) => v !== null && v !== undefined),
      ),
    };

    return {
      topic: parsed.topic || rawQuery.slice(0, 60),
      intent: parsed.intent || `Find research papers about: ${rawQuery}`,
      keywords: parsed.keywords || extractKeywordsHeuristic(rawQuery),
      excludeKeywords: parsed.excludeKeywords || [],
      searchTerms: parsed.searchTerms || [rawQuery],
      filters: mergedFilters,
      reasoning: parsed.reasoning || "Query analyzed and structured.",
    };
  } catch (err) {
    console.error("[AI] understandQuery failed:", err);
    return heuristicUnderstand(rawQuery, filters);
  }
}

/**
 * Generate a concise AI summary and structured insights for a single paper.
 */
export async function summarizePaper(
  title: string,
  abstract: string,
  userQuery?: string,
): Promise<PaperInsights> {
  const zai = await getZAI();

  const systemPrompt = `You are an expert academic paper analyst. Analyze the paper below and produce a concise structured analysis.

Respond with ONLY a valid JSON object (no markdown, no fences):
{
  "summary": "2-3 sentence summary of the paper's main contribution",
  "keyContributions": ["3-5 bullet points describing what the paper contributes"],
  "advantages": ["2-4 strengths of the approach"],
  "limitations": ["2-4 weaknesses or constraints"],
  "futureScope": ["2-3 potential future research directions"],
  "keywords": ["5-8 important keywords from the paper"]
}

If the abstract is too thin to evaluate honestly, say so in the summary and provide a best-effort analysis based on the title.`;

  const userPrompt = `Paper title: ${title}

Abstract:
${abstract || "(no abstract provided)"}

${userQuery ? `User's research context: ${userQuery}` : ""}

Return the JSON analysis.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = extractContent(completion);
    const parsed = parseJsonLoose(content);

    if (!parsed) {
      return fallbackInsights(title, abstract);
    }

    return {
      summary: parsed.summary || `This paper addresses ${title.toLowerCase()}.`,
      keyContributions: Array.isArray(parsed.keyContributions) ? parsed.keyContributions : [],
      advantages: Array.isArray(parsed.advantages) ? parsed.advantages : [],
      limitations: Array.isArray(parsed.limitations) ? parsed.limitations : [],
      futureScope: Array.isArray(parsed.futureScope) ? parsed.futureScope : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch (err) {
    console.error("[AI] summarizePaper failed:", err);
    return fallbackInsights(title, abstract);
  }
}

/**
 * Recommend related search topics based on a set of saved papers.
 */
export async function recommendTopics(
  savedTitles: string[],
  currentQuery?: string,
): Promise<string[]> {
  if (savedTitles.length === 0) return [];
  const zai = await getZAI();

  const systemPrompt = `You are an academic research recommender. Given a list of papers a researcher has saved, suggest 5-8 related research topics they might want to explore next.

Respond with ONLY a JSON array of strings (no markdown, no fences). Each string should be a concise topic (2-6 words).`;

  const userPrompt = `Saved paper titles:
${savedTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

${currentQuery ? `Current research focus: ${currentQuery}` : ""}

Suggest 5-8 related research topics as a JSON array of strings.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
    });
    const content = extractContent(completion);
    const parsed = parseJsonLoose(content);
    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string").slice(0, 8);
    }
    return [];
  } catch (err) {
    console.error("[AI] recommendTopics failed:", err);
    return [];
  }
}

// ---------- helpers ----------

function extractContent(completion: unknown): string {
  if (!completion) return "";
  // The SDK returns OpenAI-style responses
  const any = completion as {
    choices?: { message?: { content?: string } }[];
    content?: string;
    response?: string;
  };
  if (any.choices?.[0]?.message?.content) return any.choices[0].message.content;
  if (typeof any.content === "string") return any.content;
  if (typeof any.response === "string") return any.response;
  return JSON.stringify(completion);
}

function parseJsonLoose(text: string): any | null {
  if (!text) return null;
  // Strip markdown code fences if present
  let clean = text.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  // Try direct parse
  try {
    return JSON.parse(clean);
  } catch {
    // Try to extract the first {...} or [...] block
    const objMatch = clean.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {
        /* ignore */
      }
    }
    const arrMatch = clean.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]);
      } catch {
        /* ignore */
      }
    }
    return null;
  }
}

const STOP_WORDS = new Set([
  "a", "an", "the", "of", "in", "on", "for", "and", "or", "to", "with",
  "by", "from", "at", "as", "is", "are", "be", "been", "this", "that",
  "these", "those", "it", "its", "into", "via", "using", "use", "based",
  "i", "need", "want", "find", "search", "papers", "paper", "about", "recent",
  "more", "than", "less", "no", "not", "but",
]);

function extractKeywordsHeuristic(query: string): string[] {
  const words = query.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || [];
  return words.filter((w) => !STOP_WORDS.has(w)).slice(0, 8);
}

function heuristicUnderstand(rawQuery: string, filters: SearchFilters): AIUnderstoodQuery {
  const keywords = extractKeywordsHeuristic(rawQuery);
  const topic = keywords.slice(0, 4).join(" ") || rawQuery.slice(0, 60);
  return {
    topic,
    intent: `Find research papers related to: ${rawQuery}`,
    keywords,
    excludeKeywords: [],
    searchTerms: [rawQuery, topic],
    filters: {
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      minCitations: filters.minCitations,
      openAccessOnly: filters.openAccessOnly ?? false,
      author: filters.author,
      publisher: filters.publisher,
      includeKeywords: filters.includeKeywords || [],
      excludeKeywords: filters.excludeKeywords || [],
      paperType: filters.paperType,
    },
    reasoning: "Heuristic interpretation (AI unavailable). Used keyword extraction and provided filters.",
  };
}

function fallbackInsights(title: string, abstract: string): PaperInsights {
  return {
    summary: `This paper, titled "${title}", addresses the topic described in the abstract. ${abstract ? "The abstract provides the main technical context." : "No abstract was available for deeper analysis."}`,
    keyContributions: ["See full paper for detailed contributions."],
    advantages: ["See full paper for evaluation of strengths."],
    limitations: ["See full paper for discussion of limitations."],
    futureScope: ["See full paper for future work section."],
    keywords: extractKeywordsHeuristic(title + " " + abstract),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// V2 — AI Evidence Synthesis
// ──────────────────────────────────────────────────────────────────────────

/**
 * V2 — Synthesize the current state of research across multiple papers.
 * Returns a structured analysis: overview, consensus, contradictions, gaps,
 * methodologies, key findings, and suggested follow-up searches.
 */
export async function synthesizeEvidence(
  papers: AcademicPaper[],
  query: string,
): Promise<EvidenceSynthesis> {
  if (papers.length === 0) {
    return {
      summary: "No papers found for this query yet.",
      consensus: "",
      contradictions: "",
      researchGaps: [],
      methodologies: [],
      keyFindings: [],
      suggestedQueries: [],
    };
  }

  const zai = await getZAI();

  const systemPrompt = `You are an expert academic research synthesizer. Given a list of paper titles and abstracts, synthesize the current state of research. Return ONLY valid JSON (no markdown, no fences) matching this schema:

{
  "summary": "3-5 sentence overview of what the research collectively shows",
  "consensus": "What most papers agree on (1-3 sentences)",
  "contradictions": "Where papers disagree or where evidence is mixed (1-3 sentences)",
  "researchGaps": ["2-3 identified gaps in the literature"],
  "methodologies": ["3-5 common approaches or methods found across papers"],
  "keyFindings": ["3-5 bullet-point findings, each with concrete takeaways"],
  "suggestedQueries": ["3 follow-up search queries a researcher might run next"]
}

Be specific and cite paper titles where useful. If there's not enough information to fill a field honestly, use an empty string or empty array.`;

  const topPapers = papers.slice(0, 10);
  const papersText = topPapers
    .map((p, i) => `PAPER ${i + 1}
TITLE: ${p.title}
ABSTRACT: ${p.abstract}
YEAR: ${p.year || "unknown"}
CITATIONS: ${p.citationCount}`)
    .join("\n---\n");

  const userPrompt = `Research query: ${query}

Top ${topPapers.length} papers found:

${papersText}

Synthesize the state of research and return the JSON.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    });

    const content = extractContent(completion);
    const parsed = parseJsonLoose(content);

    if (!parsed) {
      return fallbackSynthesis(papers, query);
    }

    return {
      summary: parsed.summary || `Found ${papers.length} papers related to: ${query}.`,
      consensus: parsed.consensus || "",
      contradictions: parsed.contradictions || "",
      researchGaps: Array.isArray(parsed.researchGaps) ? parsed.researchGaps : [],
      methodologies: Array.isArray(parsed.methodologies) ? parsed.methodologies : [],
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      suggestedQueries: Array.isArray(parsed.suggestedQueries) ? parsed.suggestedQueries : [],
    };
  } catch (err) {
    console.error("[AI] synthesizeEvidence failed:", err);
    return fallbackSynthesis(papers, query);
  }
}

function fallbackSynthesis(papers: AcademicPaper[], query: string): EvidenceSynthesis {
  return {
    summary: `Found ${papers.length} papers related to: ${query}. The top-cited paper is "${papers[0]?.title || "(none)"}" with ${papers[0]?.citationCount || 0} citations.`,
    consensus: "AI synthesis unavailable — see individual paper insights for details.",
    contradictions: "",
    researchGaps: [],
    methodologies: [],
    keyFindings: papers.slice(0, 3).map((p) => `"${p.title}" (${p.year || "n.d."}) — ${p.citationCount} citations.`),
    suggestedQueries: [],
  };
}

// ──────────────────────────────────────────────────────────────────────────
// V2 — PDF Full-Text Q&A
// ──────────────────────────────────────────────────────────────────────────

/**
 * V2 — Answer a question about a paper by extracting text from its PDF
 * and passing the most relevant chunks to the LLM.
 *
 * Implementation:
 *   1. Fetch the PDF from pdfUrl (server-side fetch).
 *   2. Extract text using pdf-parse.
 *   3. Chunk the text into ~2000-token segments.
 *   4. Find the chunks most relevant to the question (simple keyword overlap).
 *   5. Pass the top chunks + question to the LLM with a strict prompt.
 *   6. Return the answer + a confidence indicator.
 */
export async function askPaperQuestion(
  pdfUrl: string,
  question: string,
): Promise<{ answer: string; confidence: "high" | "medium" | "low" }> {
  // SSRF guard — NEVER trust a client-supplied URL without validation.
  // This prevents the server from being tricked into fetching internal
  // cloud-metadata endpoints (e.g. AWS 169.254.169.254) or loopback services.
  const { validateOutboundUrl } = await import("../security");
  const urlCheck = validateOutboundUrl(pdfUrl);
  if (!urlCheck.ok || !urlCheck.url) {
    console.warn("[askPaperQuestion] blocked outbound URL:", urlCheck.reason);
    return {
      answer: `The provided PDF URL was blocked for security reasons (${urlCheck.reason}). Only public http(s) URLs are allowed.`,
      confidence: "low",
    };
  }
  const safeUrl = urlCheck.url.toString();

  // Cap question length to prevent LLM context abuse
  const safeQuestion = question.slice(0, 2000);

  // Lazy-load unpdf (server-friendly PDF text extraction built on pdfjs-dist).
  // NOTE: We switched from `pdf-parse` v2 to `unpdf` because pdf-parse v2 requires
  // a pdfjs-dist worker module that Next.js's Turbopack cannot resolve in dev mode
  // (error: "Setting up fake worker failed: Cannot find module 'pdf.worker.mjs'").
  // `unpdf` is specifically designed for serverless / Node.js environments and
  // handles the worker setup internally.
  let extractText: (data: ArrayBuffer | Uint8Array, options?: { mergePages?: boolean }) => Promise<{ totalPages: number; text: string | string[] }>;
  try {
    const mod = await import("unpdf");
    extractText = mod.extractText as typeof extractText;
  } catch (importErr) {
    console.error("[askPaperQuestion] unpdf import FAILED:", importErr);
    return {
      answer: "The PDF text extraction library failed to load. Please try again later.",
      confidence: "low",
    };
  }

  // Step 1: Fetch the PDF (with size cap to prevent memory exhaustion)
  const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
  let res: Response;
  try {
    res = await fetch(safeUrl, { redirect: "follow" });
  } catch (fetchErr) {
    console.error("[askPaperQuestion] PDF fetch FAILED:", fetchErr);
    return {
      answer: `Failed to download the PDF: ${fetchErr instanceof Error ? fetchErr.message : "network error"}. The paper's PDF link may be behind a paywall or temporarily unavailable.`,
      confidence: "low",
    };
  }
  if (!res.ok) {
    console.error("[askPaperQuestion] PDF fetch returned HTTP", res.status);
    return {
      answer: `Failed to download the PDF (HTTP ${res.status}). The paper's PDF may be behind a paywall or require institutional access.`,
      confidence: "low",
    };
  }

  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength > MAX_PDF_BYTES) {
    return {
      answer: `The PDF is too large to process (${(contentLength / 1024 / 1024).toFixed(1)} MB). Maximum supported size is 25 MB.`,
      confidence: "low",
    };
  }

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_PDF_BYTES) {
    return {
      answer: `The PDF is too large to process (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB). Maximum supported size is 25 MB.`,
      confidence: "low",
    };
  }

  // Step 2: Extract text using unpdf
  let fullText = "";
  try {
    const result = await extractText(arrayBuffer, { mergePages: true });
    fullText = (Array.isArray(result.text) ? result.text.join("\n\n") : result.text).trim();
  } catch (parseErr) {
    console.error("[askPaperQuestion] PDF text extraction failed:", parseErr);
    return {
      answer: "Failed to extract text from this PDF. It may be a scanned image, encrypted, or in an unsupported format.",
      confidence: "low",
    };
  }

  // Cap full-text length to prevent context overflow (150k chars ≈ ~30k tokens)
  const MAX_TEXT_CHARS = 150_000;
  if (fullText.length > MAX_TEXT_CHARS) {
    fullText = fullText.slice(0, MAX_TEXT_CHARS);
  }

  if (!fullText || fullText.length < 50) {
    return {
      answer: "The PDF appears to contain no extractable text (it may be a scanned image). Q&A is not available for this paper.",
      confidence: "low",
    };
  }

  // Step 3: Chunk into ~2000-token segments (approximated as 8000 chars)
  const CHUNK_SIZE = 8000;
  const chunks: string[] = [];
  for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
    chunks.push(fullText.slice(i, i + CHUNK_SIZE));
  }

  // Step 4: Find the chunks most relevant to the question
  const questionWords = safeQuestion.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || [];
  const scored = chunks.map((chunk) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const w of questionWords) {
      const matches = lower.split(w).length - 1;
      score += matches;
    }
    return { chunk, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const topChunks = scored.slice(0, 3).map((s) => s.chunk);

  // Step 5: Ask the LLM
  const zai = await getZAI();
  const systemPrompt = `You are an expert research assistant answering questions about an academic paper. You will be given chunks of text extracted from the paper's PDF. Use ONLY this text to answer the question.

Rules:
- If the answer is clearly stated in the text, quote or paraphrase it accurately.
- If the answer is partially supported, say what the text says and what it doesn't.
- If the answer is not in the provided text, say "The paper does not appear to address this question in the available sections." Do not speculate.
- Cite specific phrases from the text where useful.
- Be concise but complete.`;

  const userPrompt = `Question: ${safeQuestion}

Paper text (chunks):
${topChunks.map((c, i) => `--- CHUNK ${i + 1} ---\n${c}`).join("\n\n")}

Answer the question based on the text above.`;

  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const answer = extractContent(completion).trim() || "Unable to generate an answer.";
    // Confidence heuristic: high if question words appear in chunks, low if not
    const totalScore = scored[0]?.score || 0;
    const confidence: "high" | "medium" | "low" =
      totalScore > 10 ? "high" : totalScore > 3 ? "medium" : "low";

    return { answer, confidence };
  } catch (err) {
    console.error("[AI] askPaperQuestion failed:", err);
    return {
      answer: "Failed to generate an answer due to an AI service error. Please try again later.",
      confidence: "low",
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// V2 — Citation Graph (References & Citations via Semantic Scholar)
// ──────────────────────────────────────────────────────────────────────────

/**
 * V2 — Fetch the references or citations of a paper using its Semantic Scholar paper ID.
 * Falls back to a title-based lookup if the paperId is not a Semantic Scholar ID.
 */
export async function fetchCitationGraph(
  paperId: string,
  paperTitle: string,
  type: "refs" | "cites",
): Promise<CitationGraph | { refsOrCites: CitationNeighbor[]; type: "refs" | "cites" }> {
  // Try to use paperId directly; if it's not an S2 ID, look it up by title.
  let s2Id: string | null = paperId;
  if (!paperId.match(/^[0-9a-fA-F]{40}$/)) {
    // Not a Semantic Scholar paperId — look up by title.
    s2Id = await lookupS2IdByTitle(paperTitle);
    if (!s2Id) {
      return { references: [], citations: [] };
    }
  }

  const endpoint = type === "refs" ? "references" : "citations";
  const url = `https://api.semanticscholar.org/graph/v1/paper/${s2Id}/${endpoint}?fields=title,authors,year,citationCount,abstract,externalIds,openAccessPdf,venue&limit=20`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    if (res.status === 429) {
      console.warn("[citation graph] Semantic Scholar rate-limited, returning empty.");
      return { references: [], citations: [] };
    }
    return { references: [], citations: [] };
  }

  const json = (await res.json()) as {
    data?: Array<{
      paper?: {
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
      const p = entry.paper || entry.citingPaper;
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

async function lookupS2IdByTitle(title: string): Promise<string | null> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", title.slice(0, 200));
  url.searchParams.set("limit", "1");
  url.searchParams.set("fields", "paperId,title");

  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { paperId?: string; title?: string }[] };
    return json.data?.[0]?.paperId || null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// V2 — Author Profile (via Semantic Scholar Author API)
// ──────────────────────────────────────────────────────────────────────────

/**
 * V2 — Fetch an author's profile (affiliations, paper count, h-index, recent papers)
 * using the Semantic Scholar Author Search API.
 */
export async function fetchAuthorProfile(name: string): Promise<AuthorProfile> {
  const url = new URL("https://api.semanticscholar.org/graph/v1/author/search");
  url.searchParams.set("query", name);
  url.searchParams.set(
    "fields",
    "name,affiliations,paperCount,citationCount,hIndex,papers.title,papers.year,papers.citationCount,papers.abstract,papers.externalIds,papers.openAccessPdf,papers.venue",
  );
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { headers: { Accept: "application/json" } });
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
