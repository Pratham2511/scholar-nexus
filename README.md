# ScholarNexus — The Evidence Desk

A **single-user local research workspace** for finding scholarly records, keeping source passages, and organizing a literature review. Retrieval uses academic APIs directly and works with AI disabled. Internet access is still required for live search.

## Start locally

Requirements: Node.js **22 or 24**, npm, and Docker Compose (or a native PostgreSQL 16 installation).

```sh
npm ci
```

Copy `.env.example` to `.env`:

```sh
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Then, in either shell:

```sh
docker compose up -d db
npm run db:deploy
npm run dev
```

Open **http://127.0.0.1:3000**. The app and database bind to loopback. Keep `AI_ENABLED=false` for the baseline workflow. `npm run doctor` checks configuration, database readiness, and baseline provider connectivity.

For native PostgreSQL, create a database and user, set `DATABASE_URL` accordingly, then run `npm run db:deploy`. The schema uses PostgreSQL; a SQLite URL is incompatible.

### Local production mode

```sh
npm run build
npm start
```

`next start` runs the normal Next.js build; this project no longer enables incompatible standalone output. No cloud deployment is part of this iteration.

### Living search worker

Keep the application running and open a second terminal:

```sh
npm run worker
```

The worker checks one due alert each minute. Daily/weekly intervals, last-check times, baseline identifiers, and inbox entries persist in PostgreSQL. The first **successful** check establishes a baseline, including an empty result. Subsequent checks notify about newly discovered records, which may be older publications. Failed checks do not clear the baseline. “Run now” works from Updates without starting the worker. No email delivery is implemented.

## Research workflow

1. **Discover:** search by topic, quoted phrase, title, DOI, or arXiv ID. Inspect source statuses and explicit filters. Results rank by title/text relevance, not citation counts or publisher prestige.
2. **Save and compare:** save paper snapshots, or add up to eight papers from different searches to Compare. The comparison selection survives refresh.
3. **Projects:** record a question and criteria, add the comparison selection, screen include/exclude/maybe with reasons, undo the most recent decision, and save reading status, tags, and notes.
4. **Reading:** inspect the abstract or upload a permitted PDF. Extracted text keeps page numbers and the document SHA-256. Capture an exact passage into Question, Method, Dataset/sample, Evaluation, Metrics, Findings, Limitations, Code/data, or Notes. Researcher notes remain separate from author passages.
5. **Evidence matrix:** inspect supporting passages from matrix cells. Missing evidence remains visibly missing. The matrix does not declare a study “best” when evaluations are incomparable.
6. **Export and revisit:** export evidence CSV, screening CSV, BibTeX, RIS, project/workspace JSON, and reproducible search records. Query/filter/source parameters are in the search URL; search records preserve source outcomes and the first returned page.
7. **Updates:** save a living search and revisit newly discovered matches in the local inbox.

The reading panel also lists actual references or citing papers from Semantic Scholar in publication order. Stable DOI, arXiv, or native Semantic Scholar identifiers are used; ambiguous first-title matching is rejected. Coverage is bounded to 20 neighbors per direction and citations are not endorsements.

## Search behavior and coverage

Default providers are **Crossref, arXiv, and Europe PMC**. No AI call, hidden agent runtime, or model-generated record is needed for retrieval. Optional OpenAlex, Semantic Scholar, IEEE, and CORE search adapters require explicit configuration in this app. PubMed coverage is available through Europe PMC; the legacy date-feed bioRxiv/medRxiv adapter is not advertised as comprehensive keyword search.

Each run retrieves at most 50 records from each selected adapter (CORE caps at 30), then normalizes, conservatively deduplicates, filters, and ranks a bounded snapshot. Up to 150 ranked records are retained for pagination. The cursor expires after five minutes or a server restart. These counts are **not unique totals across the entire literature**. Year constraints are sent upstream to the three default sources; Crossref also receives the author filter and Europe PMC the access filter. Remaining filters apply locally to the snapshot. Missing metadata cannot satisfy a hard constraint.

Per-provider requests are serialized within the single app process, with bounded retries, Retry-After handling, cancellation, response-size limits, and an overall search deadline. arXiv requests are spaced by at least three seconds. Identical searches coalesce and completed snapshots are cached with a bounded lifetime. Do not run multiple app replicas against the same providers without introducing a shared scheduler.

Provider failure, rate limiting, missing configuration, timeout, and a successful empty response remain distinct. Partial results are useful; all-source failure returns HTTP 503 with diagnostics. Saved research is independent of provider availability.

## Optional configuration

All keys stay on the server. Set only the integrations you intend to use:

| Variable | Purpose |
| --- | --- |
| `ACADEMIC_CONTACT_EMAIL` | Your real optional contact email for provider requests |
| `OPENALEX_API_KEY` | Enable the optional OpenAlex adapter |
| `SEMANTIC_SCHOLAR_API_KEY` | Enable Semantic Scholar search and authenticate citation requests |
| `IEEE_API_KEY` | Enable IEEE Xplore |
| `CORE_API_KEY` | Enable CORE v3 |
| `AI_ENABLED` | `false` by default |
| `AI_BASE_URL` | Optional OpenAI-compatible API base, including `/v1` when required |
| `AI_MODEL` | Exact model served by that endpoint |
| `AI_API_KEY` | Optional server credential for that endpoint |

With AI disabled, Questions shows clearly labeled keyword-matched source passages, **not generated answers or confidence scores**. With AI enabled, the model selects verbatim source passages; the server rejects quotations that do not occur on the cited page. Unsupported questions abstain. Only successful grounded responses are cached by text/document version, question, endpoint, and model. This conservative flow deliberately does not generate unsupported scientific conclusions.

PDFs are uploaded by the researcher, limited to 15 MB and 500 pages, and extracted in a resource-limited worker with a deadline. Arbitrary server-side PDF URL fetching is no longer used by Q&A. The current workspace stores extracted text and hash, not the original PDF binary. Retain the original file. Scanned PDFs require external OCR; tables, equations, and figures may be omitted during extraction.

## Existing databases and backups

New databases: `npm run db:deploy` applies both migrations.

Existing databases created from the old schema without migration history: **back up first**, inspect the schema against the original `6b0ee15` version, and only when it matches mark the baseline as already applied:

```sh
npx prisma migrate resolve --applied 202609070001_baseline
npm run db:deploy
```

Do not mark a migration applied to an empty or mismatched database. The second migration adds the research workspace, complete-metadata storage, and uniqueness constraints. It intentionally refuses duplicate saved-paper or collection-member keys instead of deleting user records. Resolve duplicates with a backup and explicit retention decisions before retrying. Ordinary setup never uses `--accept-data-loss` or resets the database.

The first workspace load copies legacy saved papers, collections, notes, and saved alert definitions into the new desk. Legacy rows remain intact. Thereafter the new workspace is the active research record; legacy endpoints are retained for compatibility but should not be used as a second editing client. Metadata already lost by the previous version cannot be reconstructed automatically.

Back up using the container's `pg_dump` so the commands avoid shell-specific binary redirection:

```sh
docker compose exec db pg_dump -U scholar -d scholar_nexus -Fc -f /tmp/scholar-nexus.dump
docker compose cp db:/tmp/scholar-nexus.dump ./scholar-nexus.dump
```

Restore into a **new** database, preserving the existing database:

```sh
docker compose cp ./scholar-nexus.dump db:/tmp/scholar-nexus.dump
docker compose exec db createdb -U scholar scholar_nexus_restored
docker compose exec db pg_restore -U scholar -d scholar_nexus_restored --no-owner /tmp/scholar-nexus.dump
```

Point `DATABASE_URL` to the restored database after inspecting it. `docker compose down` preserves the named volume; do not add `-v` unless intentionally deleting your data. Keep database backups and `.env` out of Git.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`GET /api/health` is process health; `GET /api/ready` verifies that the workspace table is available. Set `TEST_DATABASE_URL` to a **dedicated disposable test database** to enable the PostgreSQL integration test; CI supplies one. Unit fixtures are restricted to tests, never presented as live research.

See [implementation and verification notes](docs/IMPLEMENTATION.md) and [observed live search checks](docs/live-search-checks.json). This is an implemented local research iteration, not a claim of multi-user production readiness. Authentication/authorization, exhaustive retrieval, complete integrity coverage, OCR, original-PDF archival, and a completed responsive browser audit are still release gates or limitations.

## Provider references

- [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [arXiv API manual](https://info.arxiv.org/help/api/user-manual.html) and [usage terms](https://info.arxiv.org/help/api/tou.html)
- [Europe PMC services](https://europepmc.org/RestfulWebService)
- [OpenAlex quick reference](https://help.openalex.org/api/llm-quick-reference/)
- [Semantic Scholar Graph API](https://api.semanticscholar.org/api-docs/graph)

MIT license. Research metadata and full text remain subject to their respective source terms.
