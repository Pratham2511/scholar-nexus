# ScholarNexus redesign — implementation status

**Status date:** 2026-09-11  
**Source brief:** `Scholar Nexus — Complete Production Redesign & Implementation Prompt.md` supplied with this task.  
**Scope:** the current local checkout of ScholarNexus on branch `main`.

This document distinguishes work actually implemented in this checkout from work still required by the supplied production-redesign brief. It does not claim that incomplete work is finished.

## What existed before this implementation pass

The active product is a Next.js 16, TypeScript, Tailwind, Prisma/PostgreSQL research workspace. Its live user-facing routes are:

| Route | Active capability |
| --- | --- |
| `/` and `/discover` | Multi-provider academic discovery, explicit filters, source diagnostics, pagination, saved searches |
| `/projects` | Projects, criteria, screening decisions, reasons, tags, notes, undo |
| `/reading` | Saved papers, PDF extraction, evidence capture, comparison matrix, exports |
| `/updates` | Local living-search alerts and inbox |

The server searches Crossref, arXiv, and Europe PMC by default; optional adapters support OpenAlex, Semantic Scholar, IEEE Xplore, and CORE. It preserves source metadata, uses conservative deduplication, applies bounded filtering/ranking, and returns typed source outcomes. The research workspace is validated with Zod and previously relied on PostgreSQL as its required persistence path.

Several older Zustand-based components and collection/profile endpoints are still present for compatibility, but the four Evidence Desk routes above are the active interface.

## Implemented in this pass

### 1. Local-first research workspace persistence

Implemented a deliberate persistence abstraction instead of adding scattered browser-storage calls:

- Added [`src/lib/workspace/repository.ts`](../src/lib/workspace/repository.ts).
- Defined `WorkspaceRepository` and `BrowserWorkspaceRepository`.
- Browser persistence uses one versioned IndexedDB database (`scholar-nexus-workspace`) and one research record, not a collection of unrelated `localStorage` values.
- Browser storage now persists the complete workspace: saved papers, projects, evidence, compare queue, search records, documents, alerts, inbox, and screening events.
- Added a guarded one-time migration path for two legacy browser keys; invalid or corrupted payloads are ignored rather than crashing the app.
- Added workspace normalization to reject duplicate paper identities, deduplicate records, limit retained data to schema caps, and keep compare IDs valid and capped at eight papers.
- Added local/remote merge behavior. Local research remains authoritative while remote alert/inbox additions can be merged without deleting offline work.
- Refactored [`src/components/desk/use-workspace.ts`](../src/components/desk/use-workspace.ts) so mutations commit locally first and asynchronously attempt the existing `/api/workspace` synchronization path afterward.
- A missing database/API no longer prevents saving, removing, comparing, recording searches, annotating, or using projects in the active Desk.
- Added explicit storage states in the UI: syncing, synced, saved locally, and temporary in-memory mode when browser storage is unavailable.

### 2. Living Research Network visual foundation

Implemented a new product-level visual layer on top of the existing functional component contracts:

- Added [`src/components/desk/research-background.tsx`](../src/components/desk/research-background.tsx), an SVG citation-field backdrop with connected paths and research nodes.
- The background is fixed, pointer-inert, inexpensive, disabled on small screens, and does not animate under `prefers-reduced-motion`.
- Added [`src/app/network.css`](../src/app/network.css) and imported it from [`src/app/globals.css`](../src/app/globals.css).
- Established a different token treatment for the active app: deep cartographic field, source-blue provenance, evidence-green action color, high-contrast text, structural borders, and consistent radius/surface behavior.
- Reworked the shared shell treatment: translucent research-navigation rail, active-route path indicator, technical grid/background, stronger search field, dense research ledger result rows, evidence reader surfaces, comparison tray, mobile-specific adjustments, and high-contrast focus behavior.

### 3. Contextual loading and interaction improvements

- Added [`src/components/desk/research-loading-graph.tsx`](../src/components/desk/research-loading-graph.tsx), a source → records → evidence → index traversal marker used during live search. This intentionally avoids fake server-side progress percentages.
- Reworked [`src/components/ui/page-loader.tsx`](../src/components/ui/page-loader.tsx) to use an application-initialization research network instead of the former numerical sweep/progress display.
- Added `Cmd/Ctrl + K` and `/` shortcuts to focus the active discovery search field without interfering with text entry.
- Updated the discovery header copy and status indicator to make the local-first model visible and non-blocking.

### 4. Existing functionality explicitly preserved

No API contracts, academic provider orchestration, PDF extraction, citation retrieval, export generation, project screening, alert behavior, or Evidence Desk route structure were removed. The new persistence hook keeps the remote workspace endpoint as an optional synchronization target rather than replacing it.

### 5. Verification completed so far

- `npm run typecheck` — **passed**.
- `npm run lint` — **passed**.
- Prisma client generation was completed before type checking.

No existing user data or repository source files were deleted. The dependency directory was installed locally for verification and is ignored by Git.

## Files changed in this pass

| File | Change |
| --- | --- |
| [`src/lib/workspace/repository.ts`](../src/lib/workspace/repository.ts) | New versioned IndexedDB repository, migration, normalization, duplicate prevention, local/remote merge helpers |
| [`src/components/desk/use-workspace.ts`](../src/components/desk/use-workspace.ts) | Local-first hydration, persistence, status reporting, optional remote sync/fallback |
| [`src/components/desk/research-background.tsx`](../src/components/desk/research-background.tsx) | New responsive/reduced-motion citation-network background |
| [`src/components/desk/research-loading-graph.tsx`](../src/components/desk/research-loading-graph.tsx) | New contextual search loading component |
| [`src/app/network.css`](../src/app/network.css) | New Living Research Network design layer and responsive motion rules |
| [`src/app/globals.css`](../src/app/globals.css) | Imports the new design layer |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | Mounts the shared research background |
| [`src/components/desk/desk.tsx`](../src/components/desk/desk.tsx) | Storage-state feedback, loading graph, and keyboard search shortcuts |
| [`src/components/ui/page-loader.tsx`](../src/components/ui/page-loader.tsx) | New network-based initialization experience |

## Remaining requirements from the supplied brief

The following are still outstanding and must be completed before calling the complete production redesign finished.

### A. Finish the systematic product-screen redesign

- [ ] Audit and visually redesign every state of Discovery: initial screen, search loading, partial provider failures, empty results, active filters, pagination, results, and paper open state.
- [ ] Finish the Projects screen redesign, including create/edit project, member selection, screen/include/exclude/maybe actions, undo, tags, reasons, and no-project state.
- [ ] Finish the Reading screen redesign, including saved-paper list, reader, PDF upload/extraction states, document page choice, exact passage capture, researcher notes, grounded Q&A, citations, evidence matrix, and export actions.
- [ ] Finish the Updates screen redesign, including create/remove/run alert, baseline explanation, source failure behavior, inbox states, and read/unread interactions.
- [ ] Review and redesign the still-present legacy Zustand components (home, results, details, library, profile, network, compare, author, collections) or retire/unify them safely if they are no longer reachable. The brief requires no confusing parallel user experience.
- [ ] Replace or refactor remaining obsolete CSS instead of relying only on later visual overrides. The new `network.css` is organized separately, but the older global layer still needs a full cleanup once the component audit is complete.

### B. Complete the design-system implementation

- [ ] Move all shared tokens, primitives, animation rules, and component variants into a fully consolidated maintainable design-system structure.
- [ ] Complete the type hierarchy audit for product identity, display headings, interface labels, long-form research text, metadata, statistics, and citations across **all** components.
- [ ] Apply shared `ResearchPanel`, source/evidence badges, result actions, empty states, error states, and tooltip patterns consistently rather than keeping one-off styles.
- [ ] Audit contrast, focus states, hover states, disabled states, and mobile touch targets across all design-system components.

### C. Complete interaction and motion polish

- [ ] Review all dialogs, dropdowns, tabs, panels, filters, save actions, comparison actions, and citation-network interactions for restrained, purposeful transitions.
- [ ] Add immediate visual confirmation to every save/remove/compare/copy action where not already provided by existing controls.
- [ ] Add user-facing source-status visualization while a search is pending; the current request cannot report genuine per-provider progress, so it must not fake it.
- [ ] Review the existing custom cursor against every active interaction and text-selection path; it existed before this pass and should be validated rather than assumed complete.
- [ ] Decide whether a focused command palette is needed after auditing current keyboard flows. Search focus shortcuts are implemented; a command palette has not been added.

### D. Finish and test local-first persistence

- [ ] Add automated unit tests for malformed IndexedDB records, legacy migration, duplicate paper identity handling, compare retention, schema upgrade handling, and local/remote merge behavior.
- [ ] Test persistence in real browsers with IndexedDB available, disabled, quota-limited, corrupted, and in private-browsing-like modes.
- [ ] Test backend-offline behavior end-to-end: save, remove, search history, reopen search, compare, project edits, evidence, refresh, and later server resynchronization.
- [ ] Define conflict resolution UX for two simultaneously edited browser tabs. Current behavior preserves local work and marks remote synchronization as pending; a production release should show a clear reconciliation decision where conflicts are meaningful.
- [ ] Confirm all active saved-paper/search-history/compare workflows use the new `useWorkspace` path rather than legacy API/Zustand helper paths.

### E. Accessibility, responsive, and performance work

- [ ] Perform keyboard-only testing for every active route and modal, including focus restoration and dialog traps.
- [ ] Perform screen-reader testing for status announcements, source diagnostics, custom cursor invisibility, loading experiences, tables, dialogs, and form labels.
- [ ] Run deliberate layout audits at mobile, tablet, laptop, large desktop, and 200% zoom. Fix overflow, density, navigation, reader-panel, and comparison-matrix issues found.
- [ ] Profile search rendering, long saved-paper libraries, evidence matrices, background/motion cost, and unnecessary rerenders. Add lazy loading where a measured bottleneck exists.

### F. Final verification not yet run

- [ ] `npm test`
- [ ] `npm run build`
- [ ] Run the application with PostgreSQL available and manually exercise every workflow required by the brief.
- [ ] Verify `/api/health` and `/api/ready`, PDF extraction, live provider partial-failure behavior, remote alerts, exports, optional AI-off behavior, and optional AI-on behavior when configured.
- [ ] Perform browser/device screenshots or a visual regression pass and fix findings.

## Important implementation notes and risks

1. The local-first path intentionally makes the browser workspace authoritative. It still syncs to the existing PostgreSQL workspace when available, but an unavailable server no longer blocks the user.
2. The active user routes use the Desk workspace hook. Older API/Zustand views should be consolidated or tested carefully before they are exposed again.
3. Search result snapshots remain bounded by the existing server design; this redesign does not claim exhaustive literature coverage.
4. The design background is CSS/SVG only—there is no permanent canvas loop, it is pointer-inert, and it honors reduced-motion settings.
5. The brief’s requested full production standard requires browser and database-backed verification, which has not happened yet. Only TypeScript and lint checks have passed at this point.

## Recommended next sequence

1. Add persistence tests and run the existing test suite.
2. Run the local app with PostgreSQL, then exercise the active four-route workflow with the database both available and unavailable.
3. Finish each screen/state audit and remove the old CSS once no active components depend on it.
4. Conduct responsive/accessibility/browser QA.
5. Run `npm test` and `npm run build`, resolve every regression, then update this checklist with actual results.
