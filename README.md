# ScholarAI — AI-Powered Multi-Source Research Paper Discovery & Recommendation System

> Describe your research in plain English. ScholarAI understands your intent, queries **Semantic Scholar, arXiv, Crossref, and PubMed in parallel**, removes duplicates, ranks papers intelligently, and generates **AI-powered insights** (summary, contributions, advantages, limitations, future scope) for every paper.

---

## Table of Contents

1. [What Is ScholarAI?](#1-what-is-scholarai)
2. [The Problem We Solve](#2-the-problem-we-solve)
3. [The Solution — End-to-End Pipeline](#3-the-solution--end-to-end-pipeline)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [Multi-Source Academic API Integration](#6-multi-source-academic-api-integration)
7. [AI Capabilities](#7-ai-capabilities)
8. [The Ranking Engine](#8-the-ranking-engine)
9. [Duplicate Detection & Merging](#9-duplicate-detection--merging)
10. [Database Schema](#10-database-schema)
11. [API Endpoints](#11-api-endpoints)
12. [Frontend — UI Pages & Features](#12-frontend--ui-pages--features)
13. [Citation Export](#13-citation-export)
14. [Personal Library & History](#14-personal-library--history)
15. [Paper Comparison](#15-paper-comparison)
16. [How to Run](#16-how-to-run)
17. [Implementation Highlights](#17-implementation-highlights)
18. [Future Enhancements](#18-future-enhancements)

---

## 1. What Is ScholarAI?

ScholarAI is an **intelligent academic research assistant** — a full-stack web application that takes a natural-language research query (e.g. *"I need recent papers about blockchain in healthcare with more than 50 citations but no survey papers"*) and returns a curated, deduplicated, AI-ranked list of papers from **four major academic repositories simultaneously**.

For every paper returned, the system can additionally produce a **structured AI analysis** — short summary, key contributions, advantages, limitations, future scope, and extracted keywords — so researchers can decide whether a paper is worth reading *before* they open it.

### Core Promise

| Instead of... | ScholarAI... |
|---|---|
| Searching one source at a time | Queries 4 academic APIs **in parallel** |
| Manual deduplication of cross-source results | Merges duplicates via **DOI + title similarity** |
| Sorting by date or citation only | Ranks with a **weighted relevance score (0–100)** |
| Reading the abstract to guess if it's relevant | Generates **AI insights** (summary, pros, cons) on demand |
| Manually formatting citations | Exports in **APA, MLA, BibTeX, Chicago** with one click |
| Losing track of papers across sessions | Saves papers, search history & favorites in a **persistent library** |

---

## 2. The Problem We Solve

Researchers today face a fragmented discovery workflow:

- **Source fragmentation** — relevant papers live across Semantic Scholar, arXiv, Crossref, PubMed, CORE, and dozens of publisher sites. Each has its own UI, search syntax, and metadata shape.
- **Duplicate noise** — the same paper appears on multiple sources with slightly different metadata (arXiv preprint → Crossref-published journal version → Semantic Scholar entry with citations).
- **No relevance ranking** — most sources sort by date or citation count, not by *semantic fit* to the researcher's actual question.
- **Shallow metadata** — abstracts alone rarely tell you whether a paper's contribution matters for *your* problem. You need analysis.
- **Manual citation drudgery** — copy-pasting BibTeX from one site, fixing author names, re-formatting to APA for a different submission.
- **No memory** — every search starts from scratch. There's no library, no history, no recommendations.

ScholarAI eliminates all of these in a single integrated web app.

---

## 3. The Solution — End-to-End Pipeline

When a user submits a query, ScholarAI runs a **9-step pipeline**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        USER SEARCH QUERY                                │
│  "I need recent papers about blockchain in healthcare with 50+          │
│   citations but no survey papers"                                       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1 — AI QUERY UNDERSTANDING                                        │
│  LLM parses the natural-language query into:                            │
│  { topic, intent, keywords, excludeKeywords, searchTerms, filters,      │
│    reasoning }                                                          │
│  Falls back to heuristic keyword extraction if the LLM fails.           │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2 — PARALLEL MULTI-SOURCE SEARCH                                  │
│  The orchestrator fans out to 4 sources concurrently with a 12-second   │
│  per-source timeout. Each adapter normalizes its source's response      │
│  into a common AcademicPaper shape.                                     │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3 — DATA NORMALIZATION                                            │
│  Each adapter (semantic-scholar.ts, arxiv.ts, crossref.ts, pubmed.ts,   │
│  core.ts) converts source-specific JSON/XML into the shared             │
│  AcademicPaper interface.                                               │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4 — DUPLICATE REMOVAL                                             │
│  deduplicatePapers() merges records by DOI first, then by normalized    │
│  title similarity. Merged records keep the richest metadata from all    │
│  sources (longest abstract, highest citation count, union of authors    │
│  and source URLs).                                                      │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5 — FILTER APPLICATION                                            │
│  applyFilters() removes papers that violate hard constraints: year      │
│  range, min citations, open-access-only, author, publisher, paper type, │
│  include/exclude keywords.                                              │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6 — INTELLIGENT RANKING                                           │
│  rankPapers() scores each paper 0–100 across 6 dimensions:              │
│   • Semantic relevance to the query keywords (40 pts)                   │
│   • Citation impact — log scale (25 pts)                                │
│   • Recency (15 pts)                                                    │
│   • Publisher / venue reputation (10 pts)                               │
│   • Open-access bonus (5 pts)                                           │
│   • Multi-source discovery bonus (5 pts)                                │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 7 — RESULTS RETURNED                                              │
│  The API returns ranked papers, per-source diagnostics (success/error/  │
│  paper count/duration), the AI-understood query, duplicates-removed     │
│  count, and total search duration.                                      │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 8 — AI INSIGHTS (ON DEMAND)                                       │
│  When a user opens a paper detail page, an async call to               │
│  /api/ai/summarize generates structured insights:                       │
│   • Summary (2–3 sentences)                                             │
│   • Key Contributions (3–5 bullets)                                     │
│   • Advantages (2–4 bullets)                                            │
│   • Limitations (2–4 bullets)                                           │
│   • Future Scope (2–3 bullets)                                          │
│   • Extracted Keywords                                                  │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 9 — PERSIST & RECOMMEND                                           │
│  • Every search is logged to SearchHistory.                             │
│  • Saved papers persist to SavedPaper (with cached AI insights).        │
│  • Citation exports are logged to ExportRecord.                         │
│  • The Profile page can ask the AI for recommended topics based on     │
│    saved papers.                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Tech Stack

The project is implemented as a **unified full-stack Next.js application** (the original spec proposed a separate React frontend + FastAPI backend, but a unified Next.js app delivers the same functionality with simpler deployment and zero CORS friction).

### Frontend
- **Next.js 16** (App Router, React Server Components)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** for styling
- **shadcn/ui + Radix UI** for the component library (40+ components)
- **Zustand** for client-side state management
- **lucide-react** for icons
- **sonner** for toast notifications
- **framer-motion** for animations

### Backend (all inside Next.js API routes)
- **Next.js Route Handlers** (`/app/api/*`) — Node.js runtime
- **Prisma ORM 6** with **SQLite** (file-based DB at `db/custom.db`) for zero-config persistence
- **z-ai-web-dev-sdk** for LLM calls (query understanding, paper summarization, recommendations)

### External APIs Consumed
- **Semantic Scholar Graph API** — `https://api.semanticscholar.org/graph/v1/paper/search`
- **arXiv Atom API** — `https://export.arxiv.org/api/query`
- **Crossref Works API** — `https://api.crossref.org/works`
- **PubMed E-utilities** — ESearch + ESummary (`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`)
- **CORE v3 API** — `https://api.core.ac.uk/v3/search/works` (optional, requires API key; gracefully skips)

---

## 5. Project Structure

```
my-project/
├── prisma/
│   └── schema.prisma                  # Database models (5 tables)
├── db/
│   └── custom.db                      # SQLite database file (auto-created)
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Main SPA entry — switches between 6 views
│   │   ├── globals.css                # Tailwind + theme tokens
│   │   └── api/                       # Backend API routes
│   │       ├── route.ts               # Health check
│   │       ├── search/route.ts        # POST /api/search (the main pipeline)
│   │       ├── ai/
│   │       │   ├── summarize/route.ts # POST /api/ai/summarize
│   │       │   └── recommend/route.ts # POST /api/ai/recommend
│   │       ├── library/route.ts       # GET/POST/DELETE saved papers
│   │       ├── history/route.ts       # GET search history
│   │       ├── citation/route.ts      # POST format a citation
│   │       ├── exports/route.ts       # GET export history
│   │       ├── profile/route.ts       # GET/PATCH/PUT user profile & favorites
│   │       └── trending/route.ts      # GET curated trending topics
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx             # Sticky nav with theme toggle
│   │   │   └── footer.tsx
│   │   ├── papers/
│   │   │   ├── home-view.tsx          # Landing page (hero + trending + recent)
│   │   │   ├── search-bar.tsx         # Hero + compact search input
│   │   │   ├── filters-panel.tsx      # Advanced filter sidebar
│   │   │   ├── results-view.tsx       # Search results with AI summary card
│   │   │   ├── paper-card.tsx         # Reusable paper card
│   │   │   ├── details-view.tsx       # Paper detail page + AI insights + cite
│   │   │   ├── compare-view.tsx       # Side-by-side comparison table
│   │   │   ├── library-view.tsx       # Saved papers
│   │   │   └── profile-view.tsx       # Profile, favorites, history, recs
│   │   └── ui/                        # 45 shadcn/ui primitives
│   │
│   ├── lib/
│   │   ├── academic/
│   │   │   ├── types.ts               # Shared TypeScript interfaces
│   │   │   ├── orchestrator.ts        # Multi-source parallel search + dedupe
│   │   │   ├── dedup.ts               # DOI + title merge logic
│   │   │   ├── rank.ts                # Filter application + ranking engine
│   │   │   ├── utils.ts               # normalizeText, extractKeywords, etc.
│   │   │   └── sources/
│   │   │       ├── semantic-scholar.ts
│   │   │       ├── arxiv.ts
│   │   │       ├── crossref.ts
│   │   │       ├── pubmed.ts
│   │   │       └── core.ts
│   │   ├── ai/
│   │   │   └── assistant.ts           # LLM: understandQuery, summarizePaper, recommendTopics
│   │   ├── citation.ts                # APA / MLA / BibTeX / Chicago formatters
│   │   ├── db.ts                      # Prisma client singleton
│   │   ├── user.ts                    # Local demo user bootstrap
│   │   ├── actions.ts                 # Client-side async helpers (fetch + store updates)
│   │   └── utils.ts                   # cn() class merge helper
│   │
│   ├── store/
│   │   └── app-store.ts               # Zustand store (view, search, papers, compare, saved)
│   │
│   └── hooks/
│       ├── use-mobile.ts
│       └── use-toast.ts
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── .env                               # DATABASE_URL=file:./db/custom.db
└── README.md                          # This file
```

---

## 6. Multi-Source Academic API Integration

Each source has a dedicated adapter in `src/lib/academic/sources/`. All adapters share the same contract: take a query string and limit, return `Promise<AcademicPaper[]>`.

### 6.1 Semantic Scholar (`semantic-scholar.ts`)
- **Endpoint:** `GET https://api.semanticscholar.org/graph/v1/paper/search`
- **Fields requested:** title, abstract, year, venue, publicationVenue, authors, citationCount, openAccessPdf, isOpenAccess, publicationTypes, journal, externalIds, fieldsOfStudy
- **Sort:** `citationCount:desc`
- **Normalization:** DOI extracted from `externalIds.DOI`; PDF link from `openAccessPdf.url`; keywords from `fieldsOfStudy`; publisher from `publicationVenue.name` → `journal.name` → `venue`.
- **Resilience:** HTTP 429 (rate limit) returns empty array instead of failing the whole search.

### 6.2 arXiv (`arxiv.ts`)
- **Endpoint:** `GET https://export.arxiv.org/api/query` (Atom XML feed)
- **Query construction:** splits the query into terms and joins them with `AND` for arXiv's field-prefix syntax.
- **Parsing:** custom regex-based Atom XML parser (no XML library dependency) extracts title, summary, published date, DOI, journal_ref, primary_category, authors, and PDF/abstract links.
- **Normalization:** arXiv IDs are extracted from the `id` URL; year parsed from the `published` date; keywords heuristically extracted from title + abstract.
- **Note:** arXiv doesn't return citation counts — they default to `0`. arXiv papers are always marked open-access.

### 6.3 Crossref (`crossref.ts`)
- **Endpoint:** `GET https://api.crossref.org/works`
- **Fields selected:** DOI, title, author, abstract, published-print/online, issued, created, is-referenced-by-count, publisher, type, link, license, subject, container-title.
- **Sort:** `is-referenced-by-count` (descending).
- **Normalization:** Crossref abstracts are wrapped in `<jats:p>` tags — stripped via regex. Year is picked from the first available date field. PDF link extracted from `link[].content-type === 'application/pdf'`. Open-access determined by Creative Commons / "open access" license URL patterns.
- **Polite pool:** includes `mailto` parameter and User-Agent string for Crossref's polite-data pool.

### 6.4 PubMed (`pubmed.ts`)
- **Endpoints:** Two-step E-utilities flow:
  1. `GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi` — returns PMIDs matching the query.
  2. `GET https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi` — fetches article metadata for those PMIDs.
- **Normalization:** title from ESummary, year parsed from `pubdate`, DOI extracted from `articleids` (where `IdType === "doi"`), source URL built from PMID.
- **Limitation:** ESummary doesn't return abstracts — they're set to a placeholder pointing users to the PubMed page.

### 6.5 CORE (`core.ts`) — optional
- **Endpoint:** `POST https://api.core.ac.uk/v3/search/works`
- **Note:** CORE requires an API key for most usage; the adapter gracefully skips (returns `[]`) on 401/403 without failing the search.

### 6.6 Orchestrator (`orchestrator.ts`)
The orchestrator:
1. Picks the best search term from the AI-understood query.
2. Spawns all enabled source adapters concurrently with `Promise.all`.
3. Wraps each adapter in a `withTimeout()` (default 12s) so a slow source doesn't block the response.
4. Flattens all results.
5. Deduplicates, filters, ranks, and caps to `finalLimit`.

Each source result includes a `SourceResult` object: `{ source, papers, success, error?, durationMs }` — surfaced in the UI as a per-source status bar.

---

## 7. AI Capabilities

All AI calls go through `src/lib/ai/assistant.ts`, which wraps the **z-ai-web-dev-sdk** with a singleton instance and three primary functions.

### 7.1 `understandQuery(rawQuery, filters)` → `AIUnderstoodQuery`

Sends the user's natural-language query + any explicit filters to the LLM with a strict system prompt that forces a JSON response:

```json
{
  "topic": "the main research topic (concise, 2-6 words)",
  "intent": "1-2 sentence description of what the user is trying to find",
  "keywords": ["core keywords, 3-8 items"],
  "excludeKeywords": ["keywords to exclude, may be empty"],
  "searchTerms": ["1-3 alternative search term strings"],
  "filters": { "yearFrom": ..., "yearTo": ..., "minCitations": ..., ... },
  "reasoning": "1-2 sentences explaining your interpretation"
}
```

**Resilience:** If the LLM fails or returns malformed JSON, the function falls back to `heuristicUnderstand()` — a deterministic keyword extractor that strips stop words and preserves any user-supplied filters.

### 7.2 `summarizePaper(title, abstract, userQuery?)` → `PaperInsights`

Generates a structured AI analysis:

```json
{
  "summary": "2-3 sentence summary of the paper's main contribution",
  "keyContributions": ["3-5 bullet points"],
  "advantages": ["2-4 strengths"],
  "limitations": ["2-4 weaknesses or constraints"],
  "futureScope": ["2-3 potential future research directions"],
  "keywords": ["5-8 important keywords"]
}
```

If the LLM fails, falls back to `fallbackInsights()` which surfaces the title + abstract without deep analysis.

### 7.3 `recommendTopics(savedTitles, currentQuery?)` → `string[]`

Given the titles of all papers a researcher has saved, suggests 5–8 related research topics they might want to explore next. Used by the Profile page to drive discovery.

### 7.4 Robust JSON Parsing
The `parseJsonLoose()` helper strips markdown code fences, attempts direct `JSON.parse()`, and falls back to regex extraction of `{...}` or `[...]` blocks. This handles the common LLM failure modes (wrapping JSON in `\`\`\`json` fences, prepending commentary, truncating output).

---

## 8. The Ranking Engine

`src/lib/academic/rank.ts` contains two functions:

### `applyFilters(papers, filters)` — Hard Constraints
Removes papers that violate:
- `yearFrom` / `yearTo` — publication year range
- `minCitations` — minimum citation count
- `openAccessOnly` — must be open access
- `author` — substring match on any author
- `publisher` / `conference` / `journal` — substring match on publisher or venue
- `paperType` — exact match, or `exclude:Review` to drop certain types
- `includeKeywords` — ALL must appear in title/abstract/keywords
- `excludeKeywords` — ANY appearance disqualifies

### `rankPapers(papers, understood)` — Soft Scoring (0–100)
Each paper is scored across 6 dimensions:

| Dimension | Max Points | Logic |
|---|---|---|
| **Semantic relevance** | 40 | Title match with topic words (15) + keyword coverage across title/abstract/keywords (15) + title keyword density (10). Exclude keywords incur a -10 penalty each. |
| **Citation impact** | 25 | `min(25, log10(citations + 1) × 10)` — log scale so a 10k-citation paper isn't 100× more valuable than a 100-citation one. |
| **Recency** | 15 | ≤1 year old: 15 · ≤3: 12 · ≤5: 8 · ≤10: 4 · else: 1. Doesn't over-penalize classics. |
| **Publisher reputation** | 10 | +10 if publisher matches a curated list (Nature, Science, IEEE, ACM, Springer, Elsevier, Wiley, Cell, Lancet, NEJM, PNAS). +3 if any venue is known. |
| **Open access bonus** | 5 | +5 if the paper is freely accessible. |
| **Multi-source discovery bonus** | 5 | +5 if the paper appears on ≥3 sources (cross-validated = higher quality), +2 for 2 sources. |

Final score is clamped to `[0, 100]` and stored on each paper as `relevanceScore`.

---

## 9. Duplicate Detection & Merging

`src/lib/academic/dedup.ts` performs cross-source deduplication in two passes:

1. **DOI match (primary)** — papers with the same DOI (case-insensitive, trimmed) are merged.
2. **Title match (fallback)** — papers without DOIs are matched by `titleKey()` — a normalized lowercase title with punctuation stripped. Only titles longer than 10 chars are eligible (avoids spurious merges on short generic titles).

### Merge Strategy (`mergeInto`)
When two records are merged, the surviving record keeps the **richest** version of every field:

- **Sources** — union (e.g. `["Semantic Scholar", "arXiv"]`)
- **Source URLs** — union, deduped by URL
- **Abstract** — the longer one wins
- **Citation count** — the larger one wins
- **Missing fields** — filled from the source record (DOI, PDF link, year, publisher, venue, paper type, open-access flag)
- **Authors** — union, deduped by normalized name
- **Keywords** — union, deduped case-insensitively

This is what lets a single paper appear in the UI as *"found on Semantic Scholar + arXiv + Crossref"* — its metadata is the superset of all three.

---

## 10. Database Schema

`prisma/schema.prisma` defines **5 models** backed by SQLite:

### `UserProfile`
The local researcher profile. The app bootstraps a single demo user (`id="local-demo-user"`, `email="demo@research-assistant.local"`) on first run via `ensureLocalUser()` in `src/lib/user.ts`.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `email` | String | Unique |
| `name` | String? | Display name |
| `affiliation` | String? | e.g. "MIT, Stanford" |
| `researchInterests` | String? | Free-text |
| `createdAt` / `updatedAt` | DateTime | Auto |

### `SavedPaper`
Stores full paper snapshots so the library works even if upstream APIs change.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `userId` | String | FK → UserProfile |
| `paperId` | String | The deduped paper ID from the orchestrator |
| `title`, `authors` (\|\|\|-joined), `abstract`, `year`, `doi`, `pdfLink`, `citationCount`, `publisher`, `source`, `keywords` (\|\|\|-joined), `openAccess` | various | Snapshot of paper metadata |
| `aiSummary` | String? | Cached JSON of `PaperInsights` — avoids re-calling the LLM |
| `savedAt` | DateTime | Auto |

Indexes on `userId` and `paperId`.

### `SearchHistory`
Every search is logged for the Recent Searches panel.

| Field | Type | Notes |
|---|---|---|
| `id`, `userId`, `query`, `filters` (JSON string), `resultCount`, `createdAt` | | |

### `FavoriteTopic`
User-curated research topics.

| Field | Type | Notes |
|---|---|---|
| `id`, `userId`, `topic`, `createdAt` | | Unique constraint on `[userId, topic]` |

### `ExportRecord`
Tracks every citation export for the Export History panel.

| Field | Type | Notes |
|---|---|---|
| `id`, `userId`, `paperTitle`, `format` (APA/MLA/BibTeX/Chicago), `createdAt` | | |

---

## 11. API Endpoints

All routes live under `src/app/api/` and run on the Node.js runtime (`export const runtime = "nodejs"`).

### `POST /api/search` — The Main Pipeline
**Request body:**
```json
{
  "query": "string",
  "filters": { "yearFrom": 2020, "minCitations": 10, ... },
  "sources": ["Semantic Scholar", "arXiv", ...],
  "limit": 50
}
```
**Response:**
```json
{
  "papers": AcademicPaper[],
  "sources": SourceResult[],
  "understoodQuery": AIUnderstoodQuery,
  "totalFound": number,
  "duplicatesRemoved": number,
  "durationMs": number
}
```
Also fires-and-forgets a `SearchHistory` write.

### `POST /api/ai/summarize`
**Request:** `{ title, abstract, userQuery? }`
**Response:** `{ insights: PaperInsights }`

### `POST /api/ai/recommend`
**Request:** `{ titles: string[], currentQuery? }`
**Response:** `{ topics: string[] }`

### `GET /api/library` — list saved papers
### `POST /api/library` — save a paper (`{ paper: AcademicPaper }`)
### `DELETE /api/library?paperId=xxx` — remove a saved paper

### `GET /api/history` — recent searches (last 30)
### `GET /api/exports` — recent citation exports (last 50)

### `POST /api/citation` — format a citation
**Request:** `{ paper: AcademicPaper, format: "APA" | "MLA" | "BibTeX" | "Chicago" }`
**Response:** `{ citation: string, format: string }`
Also logs an `ExportRecord`.

### `GET /api/profile` — profile + favorites + stats
### `PATCH /api/profile` — update name / affiliation / researchInterests
### `PUT /api/profile` — add/remove a favorite topic (`{ action, topic }`)

### `GET /api/trending` — curated list of 12 trending research topics across domains (AI, biotech, quantum, climate, etc.)

---

## 12. Frontend — UI Pages & Features

The app is a **single-page application** with view-switching driven by the Zustand store (`src/store/app-store.ts`). The store tracks: current view, search query/filters, results, selected paper, compare set, saved IDs, theme, and recent searches.

### View 1: Home (`home-view.tsx`)
- **Hero search bar** with a large textarea and natural-language placeholder example.
- **Feature highlight cards**: Multi-Source, Deduplicated, AI Ranked, AI Insights.
- **Trending Research Topics** — clickable chips that fire a search instantly.
- **Recent Searches** — last 8 searches, clickable to re-run.
- **CTA row** linking to Library, Profile (AI recommendations), and Compare.

### View 2: Results (`results-view.tsx`)
- **AI Query Understanding card** — shows the topic, reasoning, and extracted keywords/exclude keywords as colored chips.
- **Source status bar** — green/red badges per source showing paper count and success/failure.
- **Duplicates-removed counter** and **total search duration**.
- **Sidebar FiltersPanel** — year range, min citations, author, publisher, paper type, open-access toggle, include/exclude keywords.
- **Sort dropdown**: Relevance / Citations / Newest.
- **Skeleton loading state** while searching.
- **Paper cards** in a vertical list.

### View 3: Paper Details (`details-view.tsx`)
- Full paper header with sources, open-access badge, paper type, authors, year, citations, publisher, DOI link.
- **Action buttons**: Save, View PDF, open on each source, Cite.
- **Citation panel**: format selector (APA / MLA / BibTeX / Chicago) + copy-to-clipboard.
- **Abstract** + keywords chips.
- **AI-Powered Analysis card**: Summary, Key Contributions, Advantages, Limitations, Future Scope, AI-extracted keywords. Auto-generates on first open; cached on the paper object.
- **Available On** card with links to every source that has this paper.

### View 4: Compare (`compare-view.tsx`)
- Side-by-side **comparison table** for 2–4 papers.
- Rows: Authors, Year, Citations, Publisher/Venue, Paper Type, Open Access, Relevance Score, DOI, Keywords, Abstract (scrollable), Links.
- Sticky left column for attribute labels.
- Horizontal scroll on mobile.
- Below the table: compact paper cards for each compared paper.

### View 5: Library (`library-view.tsx`)
- Lists all saved papers as full paper cards.
- Empty state with CTA back to Home.
- Loading spinner while fetching.

### View 6: Profile (`profile-view.tsx`)
- **Stats row**: Saved papers count, Searches run count, Citations exported count.
- **Researcher Profile** card — editable name, affiliation, research interests.
- **Favorite Topics** — add/remove chips.
- **AI-Recommended Topics** — generated from saved paper titles; clickable to fire a new search.
- **Recent Searches** (last 12).
- **Export History** (last 20 citation exports).

### Reusable Components
- **`SearchBar`** — hero variant (large textarea, ⌘+↵ shortcut) + compact inline variant.
- **`FiltersPanel`** — collapsible advanced filter sidebar with active-count badge.
- **`PaperCard`** — full + compact variants; shows source badges (color-coded per source), relevance score, authors, abstract preview, metadata, keyword chips, action buttons (Save / Compare / PDF / Details).
- **`Header`** — sticky nav with 5 view tabs (Home / Results / Compare / Library / Profile), badges showing compare & library counts, and a dark/light theme toggle.
- **`Footer`** — minimal footer.

### UI Library
45 shadcn/ui components are included in `src/components/ui/` (button, card, badge, dialog, dropdown, select, table, tabs, tooltip, toast, etc.) — all built on Radix UI primitives with Tailwind theming.

---

## 13. Citation Export

`src/lib/citation.ts` implements four citation formatters — all pure functions, no external libraries:

### APA (7th edition)
- Authors: `Last, F. M., & Last, F. M.` (up to 20; uses `...` ellipsis for 21+)
- Format: `Author(s) (Year). Title. Venue. https://doi.org/...`

### MLA (9th edition)
- Authors: `Last, First` for one; `Last, First, et al.` for multiple
- Format: `Authors. "Title." Venue, Year. doi: ...`

### BibTeX
- Generates a `@article{...}` entry with `title`, `author` (joined with ` and `), `year`, `journal`, `doi`, `url`.
- Bib key auto-generated from first author's last name + year + first title word.

### Chicago (17th edition)
- Authors: `Last, First` for one; `Last, First, et al.` for multiple
- Format: `Authors. "Title." Venue, Year. https://doi.org/...`

All formats are surfaced through the `/api/citation` endpoint and the citation panel on the Details page.

---

## 14. Personal Library & History

### Saved Papers
- **Save** from any PaperCard or the Details page → `POST /api/library` with the full `AcademicPaper` object.
- AI insights are cached in `SavedPaper.aiSummary` (JSON string) — re-opening a saved paper doesn't re-call the LLM.
- **Remove** via the bookmark toggle or `DELETE /api/library?paperId=xxx`.
- The library persists across sessions in SQLite.

### Search History
- Every `/api/search` call writes a `SearchHistory` row (fire-and-forget, non-blocking).
- Surfaced on the Home page (last 8) and Profile page (last 12).
- Clicking a recent search re-runs it instantly.

### Favorite Topics
- Add/remove on the Profile page.
- Used as additional context for AI recommendations.

### Export History
- Every `/api/citation` call logs an `ExportRecord`.
- Surfaced on the Profile page.

---

## 15. Paper Comparison

The Compare view (`compare-view.tsx`) lets researchers select 2–4 papers (via the "Compare" button on any PaperCard) and view them side-by-side in a sticky-header table.

**Compared attributes:**
- Authors, Year, Citations, Publisher/Venue, Paper Type, Open Access, Relevance Score, DOI, Keywords (top 5), Abstract (scrollable), and all source/PDF links.

The comparison is computed from the current search results' `compareIds` set in the Zustand store. The set persists across navigation until the user clicks "Clear all".

---

## 16. How to Run

### Prerequisites
- Node.js 18+ (or Bun)
- An internet connection (for the academic APIs and the LLM SDK)

### Installation
```bash
# Install dependencies
bun install   # or npm install

# Set up the database
bun run db:push   # creates db/custom.db from schema.prisma

# Start the dev server
bun run dev       # or npm run dev
```

The app runs at **http://localhost:3000**.

### Environment
The only env var is `DATABASE_URL`, already set in `.env`:
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

The `z-ai-web-dev-sdk` is pre-configured with credentials baked into the SDK — no additional API keys needed for the LLM features.

### Academic API Keys
- **Semantic Scholar, arXiv, Crossref, PubMed** — all work without API keys (with rate limits).
- **CORE** — requires an API key for its v3 endpoint; the adapter gracefully skips if missing.

---

## 17. Implementation Highlights

### Resilience Patterns
- **Per-source timeouts** (12s) — a slow source doesn't block the response.
- **Per-source error isolation** — if one source fails, others still return results; the failure is surfaced in the UI as a red badge with the error message.
- **Rate-limit handling** — Semantic Scholar's HTTP 429 returns `[]` instead of throwing.
- **AI fallbacks** — if the LLM fails to return parseable JSON for query understanding, a heuristic keyword extractor takes over. If summarization fails, a placeholder insight is returned.
- **Fire-and-forget persistence** — search history and export records are written asynchronously without blocking the API response.

### Type Safety
- All API contracts are typed via `src/lib/academic/types.ts` (`AcademicPaper`, `AIUnderstoodQuery`, `SearchFilters`, `SearchResult`, `SourceResult`, `PaperInsights`).
- The Prisma schema generates typed client methods — no raw SQL anywhere.

### State Management
- **Zustand** for client state — single store with slices for navigation, search, results, compare, saved, and theme.
- **No React Context boilerplate** — components subscribe directly to store slices via `useAppStore((s) => s.someField)` for selective re-rendering.

### Performance
- Parallel source fetching with `Promise.all`.
- AI insights are generated lazily (only when a paper is opened) and cached on the paper object — re-opening doesn't re-call the LLM.
- Prisma client is singleton-cached on `globalThis` to avoid connection pool exhaustion in dev.

### UX Details
- **Color-coded source badges**: Semantic Scholar (emerald), arXiv (red), Crossref (orange), PubMed (blue), CORE (purple).
- **Dark/light theme toggle** in the header.
- **Keyboard shortcut** ⌘+↵ to submit the hero search.
- **Toast notifications** for save/remove/cite actions.
- **Skeleton loaders** during search and AI generation.
- **Responsive layout** — filters collapse to a drawer on mobile, comparison table scrolls horizontally.

---

## 18. Future Enhancements

The project is structured to support the following extensions without major refactoring:

- **Full-text PDF ingestion** — download PDFs and run AI summarization on the full text, not just the abstract.
- **Citation graph traversal** — "papers that cite this paper" / "papers this paper cites" using Semantic Scholar's references API.
- **User authentication** — replace the local demo user with NextAuth.js (already in dependencies) for multi-user support.
- **PostgreSQL migration** — change `provider = "sqlite"` to `"postgresql"` in `schema.prisma`; all queries are already provider-agnostic.
- **Collaborative libraries** — share saved paper collections with research groups.
- **Reading lists & tags** — let users organize saved papers into named collections.
- **Browser extension** — save papers directly from publisher sites.
- **Email/Push alerts** — notify when new papers match a saved query.
- **Semantic search via embeddings** — replace keyword matching with vector similarity for query understanding.
- **Export to Notion / Zotero / Mendeley** — sync saved papers with reference managers.
- **Batch summarization** — generate a synthesis across multiple saved papers ("What does my library say about X?").

---

## Summary

**ScholarAI is a complete, working, end-to-end implementation of the AI-Powered Multi-Source Research Paper Discovery and Recommendation System.** It integrates 4 academic APIs in parallel, applies AI-driven query understanding, deduplicates and ranks results with a transparent scoring algorithm, generates structured AI insights per paper, supports 4 citation formats, persists a personal library with search history and favorites, and provides side-by-side paper comparison — all in a polished, responsive Next.js + TypeScript + Tailwind + shadcn/ui frontend backed by Prisma/SQLite.

Every feature in the original specification has been implemented. The codebase is structured for clarity (each source adapter is isolated, the ranking engine is a pure function, the AI layer is a thin wrapper with fallbacks), and is ready for the future enhancements listed above.
