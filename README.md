# ScholarNexus

### AI-Powered Multi-Source Academic Research Discovery Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> Describe your research in plain English. ScholarNexus understands your intent, queries **9 academic sources in parallel**, removes duplicates, ranks intelligently, generates **AI insights per paper**, and lets you explore citation networks, synthesize evidence, chat with PDFs, organize collections, follow authors, and subscribe to search alerts — all in one place.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

ScholarNexus is a full-stack academic research assistant that aggregates results from 9 major scholarly APIs in a single query. Instead of jumping between Google Scholar, arXiv, PubMed, and IEEE, you describe your research goal once in natural language — the platform understands the intent, expands the query into multiple search variants, fans them out in parallel, deduplicates the merged results, and ranks them by a composite score combining citation count, recency, source authority, and open-access preference.

Every result comes with an AI-generated summary, key contributions, methodology notes, and limitations. Beyond search, the platform supports citation-network visualization, evidence synthesis across multiple papers, conversational Q&A on uploaded PDFs, persistent collections, search alerts, and full-text exports in BibTeX/RIS/CSV.

### What problem does it solve?

Researchers waste significant time switching between siloed academic databases, each with its own query syntax, ranking algorithm, and metadata quality. ScholarNexus eliminates this friction by:

1. **Unifying 9 sources** behind a single natural-language interface.
2. **Removing duplicates** that appear across arXiv, Crossref, Semantic Scholar, etc.
3. **Ranking intelligently** — not just by citation count, but by a transparent composite score.
4. **Synthesizing** findings across multiple papers using AI.
5. **Persisting** your library, collections, alerts, and Q&A history locally.

---

## Key Features

### Search & Discovery

| Feature | Description |
|---|---|
| **Natural-language queries** | Ask "papers on graph neural networks for cyberattack detection" — the AI rewrites it into precise search variants. |
| **9 parallel sources** | Semantic Scholar, arXiv, Crossref, PubMed, OpenAlex, IEEE Xplore, bioRxiv, Europe PMC, CORE. |
| **Agentic query expansion** | The AI generates up to 3 query variants to widen recall without sacrificing precision. |
| **Intelligent deduplication** | Papers returned by multiple sources are merged using DOI, title-hash, and fuzzy matching. |
| **Composite ranking** | Score = `f(citations, recency, sourceAuthority, openAccess)`. |
| **Filters** | Year range, open-access-only, min citations, source filter, sort order. |

### AI-Powered Insights

| Feature | Description |
|---|---|
| **Per-paper summary** | TL;DR, key contributions, methodology, limitations — generated on demand. |
| **Evidence synthesis** | Ask "what are the common datasets used across these papers?" — the AI cross-references results. |
| **Topic recommendations** | Get suggested follow-up topics based on your current results. |
| **PDF Q&A** | Upload a paper PDF and ask questions grounded in its full text. |

### Workflow & Persistence

| Feature | Description |
|---|---|
| **Collections** | Organize papers into named, color-coded reading lists with per-paper notes. |
| **Library** | Save individual papers for later — fully searchable and filterable. |
| **Search alerts** | Subscribe to a query + filter combo with daily/weekly frequency. |
| **Search history** | Every query is persisted for quick re-run. |
| **Author profiles** | View author affiliation, h-index, recent papers via Semantic Scholar. |
| **Citation graph** | Interactive D3 visualization of forward/backward citations. |
| **Exports** | BibTeX, RIS, CSV, JSON — per paper or entire collection. |
| **Trending topics** | Discover hot topics in your field. |

### UX

- **Light & dark themes** with system-preference detection.
- **Fully responsive** — mobile, tablet, desktop.
- **Keyboard-friendly** — `cmd+K` command palette, `/` focuses search.
- **Toast notifications** for async operations.
- **Real-time progress** during multi-source search.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 (strict mode) |
| **Runtime** | Node.js ≥ 20 |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui (Radix primitives) |
| **State** | Zustand, TanStack Query 5 |
| **Database** | SQLite (dev) / PostgreSQL (prod) via Prisma 6 |
| **AI** | `z-ai-web-dev-sdk` (chat, embeddings, vision) |
| **Visualization** | D3.js (citation graphs), Recharts (stats) |
| **PDF** | `pdf-parse` + `unpdf` for text extraction |
| **Forms** | React Hook Form + Zod 4 |
| **Animations** | Framer Motion |
| **Package manager** | Bun (recommended) or npm |

---

## Architecture

### Search Pipeline (10 steps)

```
User Query
    │
    ▼
┌─────────────────────────────────┐
│ 1. AI Query Understanding       │  ← NLP parses intent, scope, domain
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 2. Agentic Query Expansion      │  ← Generates up to 3 variants
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 3. Parallel Source Search       │  ← 9 sources × 3 variants = ≤27 fetches
│    (12s per-source timeout)     │     with `Promise.allSettled`
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 4. Normalize to Unified Schema  │  ← All sources map to `Paper` type
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 5. Deduplicate                  │  ← DOI match → title-hash → fuzzy
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 6. Apply Filters                │  ← Year, citations, OA, source
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 7. Composite Rank               │  ← citations × recency × authority × OA
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 8. Return Results               │  ← Paginated, sorted
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 9. AI Insights (lazy)           │  ← Per-paper summary on demand
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ 10. Persist to History          │  ← SearchHistory table
└─────────────────────────────────┘
```

### Source Adapters

Each source is an isolated adapter implementing a common interface (`Paper[] fetch(query, opts)`). Failures in any single source do not break the overall search — `Promise.allSettled` ensures partial results are always returned.

| Source | Auth | Notes |
|---|---|---|
| Semantic Scholar | None (rate-limited) | Primary source for citation counts and author h-index. |
| arXiv | None | Preprints — physics, CS, math, biology. |
| Crossref | None (polite email recommended) | DOI metadata for ~150M works. |
| PubMed | None | Biomedical literature via NCBI E-utilities. |
| OpenAlex | None | 240M+ works, open metadata. |
| IEEE Xplore | **API key required** | Skipped silently if no key. |
| bioRxiv | None | Biology preprints. |
| Europe PMC | None | Open-access biomedical. |
| CORE | **API key required** | Open-access research papers. Excluded from defaults if no key. |

---

## Getting Started

### Prerequisites

- **Node.js ≥ 20** (or Bun ≥ 1.1)
- **SQLite** (bundled, no install needed) — or PostgreSQL for production

### Installation

```bash
# 1. Clone
git clone https://github.com/Pratham2511/scholar-nexus.git
cd scholar-nexus

# 2. Install dependencies
bun install                      # or: npm install

# 3. Configure environment
cp .env.example .env             # then edit .env if you have API keys

# 4. Initialize database
bun run db:push                  # creates SQLite schema
bun run db:generate              # generates Prisma client

# 5. Start dev server
bun run dev                      # http://localhost:3000
```

### Production Build

```bash
bun run build
bun run start                    # serves on port 3000
```

### Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with Turbopack |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run `tsc --noEmit` |
| `bun run db:push` | Push schema to DB (with `--accept-data-loss`) |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run db:migrate` | Create a migration |
| `bun run db:reset` | Reset DB (dev only!) |

---

## Environment Variables

All variables live in `.env` (gitignored). Copy `.env.example` and adjust:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./db/custom.db` | Prisma connection string. Use `postgresql://...` for production. |
| `IEEE_API_KEY` | No | `""` | IEEE Xplore API key. Get one at https://developer.ieee.org/ |
| `CORE_API_KEY` | No | `""` | CORE API key. Get one at https://core.ac.uk/services/api |
| `NODE_ENV` | No | `development` | `development` or `production` |

> **Security note:** `.env` is gitignored. Never commit real credentials. Use `.env.example` as the template for new variables.

---

## Database Schema

Prisma schema lives at `prisma/schema.prisma`. The app uses 9 models:

| Model | Purpose |
|---|---|
| `UserProfile` | Local user profile (single demo user with `id="local"` by default). |
| `SavedPaper` | Papers saved to the user's library. |
| `SearchHistory` | Every executed search query. |
| `FavoriteTopic` | Topics the user has bookmarked. |
| `ExportRecord` | Audit log of generated exports. |
| `Collection` | Named reading lists (color-coded). |
| `CollectionPaper` | Join table: paper ↔ collection, with optional notes. |
| `SearchAlert` | Subscribed search queries with daily/weekly frequency. |
| `PaperQA` | Cached Q&A pairs from PDF conversations. |

To reset the DB in development:

```bash
rm -f db/custom.db db/custom.db-journal   # wipe SQLite
bun run db:push                            # recreate schema
```

---

## API Reference

All routes live under `src/app/api/` and return JSON.

### Search

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/search` | Execute a search. Body: `{ query, filters?, page? }`. Returns `{ papers, totalCount, took }`. |

### AI

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ai/summarize` | Generate summary for a single paper. |
| `POST` | `/api/ai/synthesize` | Synthesize evidence across multiple papers. |
| `POST` | `/api/ai/ask-paper` | Ask a question against an uploaded PDF. |
| `GET`  | `/api/ai/recommend` | Get recommended topics based on recent searches. |

### Library & Collections

| Method | Path | Description |
|---|---|---|
| `GET` / `POST` | `/api/library` | List or save papers to library. |
| `DELETE` | `/api/library?paperId=...` | Remove a paper from library. |
| `GET` / `POST` | `/api/collections` | List or create collections. |
| `POST` | `/api/collections/paper` | Add a paper to a collection. |

### Discovery

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/author?name=...` | Get author profile + recent papers. |
| `GET` | `/api/citation?paperId=...` | Get citation graph (forward + backward). |
| `GET` | `/api/citations?paperId=...` | Get raw citation list. |
| `GET` | `/api/trending` | Get trending topics. |
| `GET` | `/api/stats` | Get aggregate platform stats. |

### User Data

| Method | Path | Description |
|---|---|---|
| `GET` / `PUT` | `/api/profile` | Get or update local user profile. |
| `GET` / `POST` | `/api/history` | List or save search history. |
| `GET` / `POST` | `/api/alerts` | List or create search alerts. |
| `POST` | `/api/exports` | Generate BibTeX/RIS/CSV export. |

---

## Project Structure

```
scholar-nexus/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # 18 API route handlers
│   │   │   ├── ai/                   # AI endpoints (summarize, synthesize, ask-paper, recommend)
│   │   │   ├── search/               # Main search endpoint
│   │   │   ├── library/              # Saved papers CRUD
│   │   │   ├── collections/          # Reading lists CRUD
│   │   │   ├── author/               # Author profile lookup
│   │   │   ├── citation/             # Citation graph data
│   │   │   ├── alerts/               # Search alert subscriptions
│   │   │   ├── history/              # Search history
│   │   │   ├── exports/              # BibTeX/RIS/CSV export
│   │   │   ├── profile/              # User profile
│   │   │   ├── stats/                # Platform stats
│   │   │   └── trending/             # Trending topics
│   │   ├── layout.tsx                # Root layout (themes, fonts)
│   │   ├── page.tsx                  # Main SPA shell
│   │   └── globals.css               # Tailwind + custom styles
│   │
│   ├── components/
│   │   ├── layout/                   # Header, footer
│   │   ├── papers/                   # 15 paper-related components
│   │   │   ├── home-view.tsx         # Landing page
│   │   │   ├── search-bar.tsx        # Search input with filters
│   │   │   ├── results-view.tsx      # Results grid
│   │   │   ├── paper-card.tsx        # Single paper card
│   │   │   ├── details-view.tsx      # Paper detail panel
│   │   │   ├── ai-synthesis-card.tsx # AI evidence synthesis UI
│   │   │   ├── citation-network.tsx  # D3 citation graph
│   │   │   ├── compare-view.tsx      # Side-by-side paper comparison
│   │   │   ├── library-view.tsx      # Saved papers library
│   │   │   ├── pdf-qa-chat.tsx       # PDF Q&A chat interface
│   │   │   ├── filters-panel.tsx     # Filter sidebar
│   │   │   ├── network-view.tsx      # Full-screen citation graph
│   │   │   ├── author-view.tsx       # Author profile panel
│   │   │   ├── profile-view.tsx      # User profile settings
│   │   │   ├── save-to-collection.tsx
│   │   │   └── alert-modal.tsx       # Create search alert
│   │   └── ui/                       # shadcn/ui primitives
│   │
│   ├── lib/
│   │   ├── academic/
│   │   │   ├── sources/              # 9 source adapters
│   │   │   │   ├── arxiv.ts
│   │   │   │   ├── biorxiv.ts
│   │   │   │   ├── core.ts
│   │   │   │   ├── crossref.ts
│   │   │   │   ├── europepmc.ts
│   │   │   │   ├── ieee.ts
│   │   │   │   ├── openalex.ts
│   │   │   │   ├── pubmed.ts
│   │   │   │   └── semantic-scholar.ts
│   │   │   ├── orchestrator.ts       # V2 orchestrator: query expansion + parallel fan-out
│   │   │   ├── dedup.ts              # DOI + title-hash + fuzzy dedup
│   │   │   ├── rank.ts               # Composite ranking algorithm
│   │   │   ├── types.ts              # Shared Paper, Source, Filter types
│   │   │   └── utils.ts              # Helpers (normalize, fetch-with-timeout)
│   │   ├── ai/
│   │   │   └── assistant.ts          # 7 AI functions (summarize, synthesize, etc.)
│   │   ├── actions.ts                # Client-side server actions (runSearch, etc.)
│   │   ├── security.ts               # Rate limiting, SSRF protection, input sanitization
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── user.ts                   # Local user helper
│   │   ├── citation.ts               # Citation format helpers
│   │   └── utils.ts                  # cn() and misc utilities
│   │
│   ├── hooks/                        # use-toast, use-mobile
│   └── store/                        # Zustand stores
│
├── prisma/
│   └── schema.prisma                 # 9 models
│
├── public/                           # Static assets
├── scripts/                          # Dev helper scripts
│   ├── watch-dev.sh                  # Auto-restart dev server on crash
│   ├── keep-dev-alive.sh             # Background keep-alive
│   ├── build_readme.py               # README builder utility
│   └── test-pdf-parse.js             # PDF parsing test
├── tests/                            # Runtime build tests
├── examples/
│   └── websocket/                    # Real-time collaboration example
├── .github/workflows/ci.yml          # GitHub Actions: lint + typecheck + build
├── Caddyfile                         # Production reverse-proxy config
├── .env.example                      # Environment template
├── .gitignore
├── components.json                   # shadcn/ui config
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Add environment variables from `.env.example` in the Vercel dashboard.
4. For production, switch `DATABASE_URL` to a PostgreSQL connection string (e.g., Vercel Postgres, Neon, Supabase).
5. Update `prisma/schema.prisma` datasource provider from `sqlite` to `postgresql`.
6. Deploy.

### Self-hosted (Caddy + Node)

A sample `Caddyfile` is included for reverse-proxying to the Next.js server on port 3000:

```bash
# Build and start
bun run build
bun run start &      # serves on :3000

# Start Caddy (uses Caddyfile in repo root)
caddy run
```

The included `Caddyfile` listens on `:81` and proxies to `localhost:3000` with proper `X-Forwarded-*` headers.

### Database migration (SQLite → PostgreSQL)

```bash
# 1. Update prisma/schema.prisma:
#    datasource db { provider = "postgresql" ... }

# 2. Set DATABASE_URL to your Postgres connection string in .env

# 3. Push schema
bun run db:push

# 4. (Optional) Migrate existing data with prisma db pull / db push
```

---

## Security

ScholarNexus includes several built-in security measures:

| Layer | Implementation |
|---|---|
| **Rate limiting** | In-memory token bucket per IP for all API routes (`src/lib/security.ts`). |
| **SSRF protection** | Outbound URLs are validated against private IP ranges before fetch. |
| **Input sanitization** | All user input is sanitized and validated with Zod schemas. |
| **Secret hygiene** | `.env` is gitignored; `.env.example` contains only placeholder values. |
| **No DB credentials in repo** | `DATABASE_URL` is read from environment at runtime. |
| **No client-side secrets** | All API keys (IEEE, CORE) are server-side only. |
| **SQL injection** | Prisma's parameterized queries prevent SQL injection. |
| **XSS** | React's automatic escaping + Zod validation on all inputs. |

### Reporting a vulnerability

If you discover a security issue, **please do not open a public issue**. Instead, email the maintainer directly or open a private security advisory on GitHub.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, code style guidelines, and PR checklist.

### Quick PR checklist

- [ ] `bun run lint` passes
- [ ] `bunx tsc --noEmit` passes
- [ ] `bun run build` passes
- [ ] No `*.db` files committed
- [ ] No `.env` file committed
- [ ] No new dependencies without justification

---

## License

[MIT](LICENSE) © Pratham Pansare

---

## Links

- **Repository:** https://github.com/Pratham2511/scholar-nexus
- **Issues:** https://github.com/Pratham2511/scholar-nexus/issues
- **License:** https://opensource.org/licenses/MIT
