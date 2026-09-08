# Evidence Desk implementation notes

Base inspected: `6b0ee15cd9064b379704a75d852f0adb9c88a6e3` on `main`.

## Root causes and audit

| Severity | Original path | Evidence / reproduction | Resolution |
| --- | --- | --- | --- |
| High | `src/app/api/search/route.ts`, `src/lib/ai/assistant.ts` | Search awaited SDK initialization before any provider request; initialization outside fallback handling could reject the request. | Search now calls deterministic query preparation and real adapters directly; removed SDK dependency. |
| High | `src/lib/ai/assistant.ts` | Model filter spread overwrote an explicit year filter. | Baseline uses explicit filters only; legacy optional query helper now spreads explicit filters last. |
| High | `src/lib/academic/orchestrator.ts` | Provider failures were converted to empty records; timeout wrappers left underlying fetches running. | Typed outcomes, request cancellation, bounded transport, source diagnostics, and HTTP 503 on total failure. |
| High | `.env.example`, `prisma/schema.prisma`, `package.json` | SQLite URL with a PostgreSQL schema; routine db push accepted data loss. | Consistent PostgreSQL Compose configuration, migrations, safe setup scripts. |
| High | `src/app/api/library/route.ts`, collection persistence | Saves lost source URLs/type metadata and check-then-create operations lacked uniqueness. | Full snapshots in the revision-checked workspace; database uniqueness constraints protect legacy keys. |
| High | `src/app/api/ai/ask-paper/route.ts` | Answers could cache error text; full-text page boundaries were missing. | Page-preserving upload extraction, verbatim grounding, abstention, success-only versioned caching; no arbitrary URL fetching. |
| Medium | `src/lib/academic/dedup.ts` | DOI map could point to a discarded title-merged record; same-title distinct works could merge. | Non-mutating, deterministic conservative identity matching; distinguish preprints and publications. |
| Medium | `src/lib/ai/assistant.ts` citation functions | Reference response parser used `paper` instead of `citedPaper`; first-result title lookup could select another work. | Citation enrichment moved out of AI module; native/DOI/arXiv IDs and correct reference contract. |
| Medium | `src/components/papers/paper-card.ts` | Citation count / maximum citation count was labeled a percentile. | Removed the badges; no quality, percentile, or exhaustive-coverage claims in the new UI. |
| Medium | `src/lib/actions.ts`, UI state | Earlier requests could overwrite later searches; failed saves could report success. | Aborted stale requests, sequence checks, response validation, and revision-checked server saves. |
| Medium | Alerts | Schedules were stored without execution or notification behavior. | Local worker, manual run endpoint, persisted baseline/history, deduplicated in-app inbox. |

Original search path: search input → client action → mandatory query AI → multi-provider coordinator → dedup/filter/rank → store → cards. New primary path: URL-backed search form → validated search API → original-query preparation → academic adapters → conservative identity merge → filters/text ranking → bounded cursor snapshot → result rows + reading panel. Saving writes the PostgreSQL research workspace with an expected revision; concurrent changes return a conflict instead of silently losing edits.

## Implemented workflow

- Direct search with explicit provider choices, source outcomes, cancellation, bounded retries/queues/cache, DOI/arXiv lookup, and cursor pagination.
- Durable projects, reading status, notes, tags, comparison selections, screening reasons/bulk actions/undo, saved query records, and exports.
- Evidence matrix with exact author passages, separate researcher notes, document/page links, and unknown-field states.
- PDF upload extraction with page/hash provenance; optional conservative passage-selection Q&A and useful AI-disabled reading.
- Citation reference/citing-paper lists and publication order using actual provider edges.
- Local alert execution with persistent empty/nonempty baselines and duplicate prevention.
- Editorial desk UI with chalk/ink/oxblood tokens, serif titles, readable rows, resizable desktop reading, mobile dialogs, focus styles, and reduced-motion support.
- PostgreSQL setup, migrations, optional AI/provider environment, local health/readiness/diagnostics, backups, and required CI checks.

Design compositions considered: a catalogue with a narrow index; a broad editorial search desk; and a dense three-column laboratory notebook. The implemented direction combines the editorial search surface with a catalogue result list and an adjacent reading pane. No generated imagery or fabricated data is used.

## Observed verification

- Type checking and lint passed after fixing the existing declaration-order lint error. All four main desk views also rendered successfully through React server rendering (this is not browser/layout verification).
- A real two-page PDF fixture passed extraction, page-boundary, content-hash, signature, and size-limit checks.
- Unit/contract/API tests cover AI-independent queries, filter precedence, identifier lookup, dedup arrival order, distinct works, unknown metadata, relevance, partial/all failure, cancellation, 429/retries, adapter schemas, reference edges, quote/page grounding, CSV/BibTeX/RIS output, pagination/coalescing, alert baselines, and duplicate notifications.
- PostgreSQL integration test is provided and enabled in GitHub CI. Locally it is skipped because this environment provides neither a PostgreSQL daemon nor Docker.
- Live checks returned real source-linked records with AI disabled for a topic, an exact title, a DOI, and a year-filtered query. The nonsense-query check returned no records from the responding sources. Some Crossref/Europe PMC requests timed out; a filtered run completed all three sources. The raw observations and timings are in `live-search-checks.json`; they are a small smoke sample, not a general relevance or speed benchmark.
- Both default and Webpack local production builds stopped before compilation with `ENOENT: uv_resident_set_memory`, an environment/runtime memory-inspection failure. No application build failure has been hidden or disabled. CI is the remaining build gate.
- Responsive browser QA and screenshots could not run because the supervised preview service was unavailable. CSS includes mobile/tablet/desktop layouts, but visual correctness at 390/768/1440px and 200% zoom has not been verified.

## Remaining limits

- The search is a bounded snapshot, not an exhaustive systematic-review engine. Search records currently retain the first returned page, labeled as such. Citation exploration is a bounded accessible list/timeline rather than a new interactive graph interface.
- Questions returns verified verbatim passages, not a generative scientific synthesis. Model selection of a passage still requires researcher judgment about relevance.
- Original uploaded PDFs are not archived; extracted text/hash/page numbers persist. No OCR or reliable reconstruction of figures/tables/equations is claimed.
- OpenAlex retraction flags are preserved and linked when supplied. Broader correction/retraction coverage remains incomplete. No absent notice is treated as a clean status.
- The whole-workspace JSON model is appropriate for this bounded single-user local iteration, with validation, size caps and optimistic concurrency. It is not a substitute for a normalized multi-user production schema.
- Existing legacy views/endpoints remain in source for continuity; the four desk routes are the active UI. Some legacy endpoint behavior is not part of the new workflow and needs retirement or migration before a multi-user release.
- Provider quotas/configuration vary. Optional adapters and optional AI need their own credentialed live checks. No cloud deployment or production-readiness claim is made.
