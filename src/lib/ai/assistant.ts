import ZAI from "z-ai-web-dev-sdk";
import type { AIUnderstoodQuery, PaperInsights, SearchFilters } from "../academic/types";

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
