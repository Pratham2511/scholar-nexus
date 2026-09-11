# SCHOLAR NEXUS — COMPLETE PRODUCT REDESIGN & PRODUCTION-LEVEL FRONTEND OVERHAUL

## ROLE

Act as a **Principal Product Designer, Staff Frontend Engineer, UX Architect, Motion Designer, Design-System Engineer, and Production Web Application Engineer**.

You are not here to make minor visual improvements.

You are taking responsibility for transforming an existing functioning application into an **original, premium, production-quality research platform** that feels intentionally designed by an experienced product team.

You must think like someone designing a product that could realistically compete with modern research platforms, knowledge tools, developer products, and high-end SaaS applications.

Repository:

https://github.com/Pratham2511/scholar-nexus

Current deployment:

https://scholar-nexus-eight.vercel.app/

Project name:

**Scholar Nexus**

Scholar Nexus is an academic research and discovery platform. Its core purpose is helping users discover, analyze, save, organize, compare, investigate, and work with academic papers and research evidence.

---

# PRIMARY OBJECTIVE

Perform a **complete frontend transformation of Scholar Nexus**.

I do NOT want a reskin.

I do NOT want the existing UI with different colors.

I do NOT want the same layout with rounded cards and gradients added.

I want the current frontend visual identity to be essentially retired and replaced by a new coherent design system.

You are free to redesign:

- visual hierarchy
- page composition
- navigation
- cards
- panels
- search experience
- paper presentation
- typography
- spacing
- borders
- buttons
- filters
- modals
- tables
- tooltips
- dropdowns
- tabs
- empty states
- loading states
- navigation transitions
- information architecture where appropriate
- micro-interactions
- background treatment
- content presentation
- icon treatment
- interaction feedback
- responsive behavior
- overall design language

Do not preserve the current styling simply because it already exists.

Preserve the **working product logic**, not the current visual appearance.

---

# NON-NEGOTIABLE RULE

## DO NOT BREAK EXISTING FUNCTIONALITY.

The application currently contains functional product logic.

Before modifying anything:

1. Inspect the repository thoroughly.
2. Understand the existing architecture.
3. Identify all routes.
4. Identify reusable components.
5. Identify state management.
6. Identify search logic.
7. Identify API dependencies.
8. Identify paper data models.
9. Identify saved-paper behavior.
10. Identify search-history behavior.
11. Identify collections/projects functionality.
12. Identify comparison functionality.
13. Identify reading functionality.
14. Identify citation-related functionality.
15. Identify exports.
16. Identify filters.
17. Identify AI functionality.
18. Identify keyboard interactions.
19. Identify responsive behaviors.
20. Identify error/loading states.

Only then begin redesigning.

Existing business logic and working integrations must continue functioning unless modification is specifically required to fix a bug.

This is a **refactor + redesign**, not a destructive rewrite.

---

# ABSOLUTELY NO GENERIC AI-GENERATED DESIGN

This requirement is extremely important.

I do NOT want what has become the stereotypical "AI-generated SaaS website".

Avoid:

- giant gradient hero sections
- purple/blue neon everywhere
- random glassmorphism
- excessive glowing borders
- meaningless animated blobs
- identical rounded cards everywhere
- generic Bento grids
- gradients applied to every heading
- huge empty spacing pretending to be minimalism
- generic Inter-font startup layouts
- random floating particles with no conceptual meaning
- excessive pills
- excessive rounded rectangles
- generic "AI-powered platform" visuals
- copy-pasted dashboard layouts
- Dribbble-style visuals with poor usability
- effects added purely because they look futuristic
- animation overload
- cheap cyberpunk styling
- template-like SaaS dashboard appearance
- obvious shadcn-default appearance
- components that look like untouched component-library examples

Do not make Scholar Nexus look like:

"another AI website."

It needs its **own identity**.

---

# DESIGN PHILOSOPHY

The interface should feel like the intersection of:

**academic intelligence + evidence investigation + research networks + modern computational tools + editorial information design**

The experience should communicate:

- intelligence
- credibility
- precision
- discovery
- interconnected knowledge
- evidence
- depth
- research
- exploration
- trust
- technological sophistication

But it should still feel exciting.

Think:

**a research instrument rather than a marketing dashboard.**

Users should feel like they have entered a sophisticated workspace for navigating human knowledge.

The interface should remain understandable even when displaying large amounts of information.

---

# CREATE AN ORIGINAL DESIGN SYSTEM

Build a complete Scholar Nexus visual system.

Define deliberate tokens for:

- primary background
- elevated surfaces
- secondary surfaces
- strong text
- muted text
- evidence/accent colors
- success
- warning
- error
- citation/source indicators
- borders
- focus rings
- shadows
- spacing
- radius scale
- typography scale
- animation durations
- easing curves
- z-index hierarchy

The system must look intentional.

Do not randomly assign colors to components.

Every color should have a purpose.

---

# TYPOGRAPHY

Replace the current typography philosophy with something much more distinctive.

Create a deliberate typography system with separate roles for:

- product identity
- large display headings
- interface labels
- long-form research text
- metadata
- numerical/statistical values
- citations/source information

Typography should help Scholar Nexus feel like an advanced research product.

Prioritize excellent readability.

Do not choose fonts merely because they are popular in AI-generated interfaces.

Avoid making every element bold.

Use weight, scale, spacing and hierarchy intelligently.

---

# VISUAL CONCEPT

Develop a visual language around the idea of a:

## "Living Research Network"

Research papers are nodes.

Authors are connections.

Citations are relationships.

Search queries create pathways through knowledge.

Saved papers form a research workspace.

Comparison reveals patterns.

Evidence converges from multiple sources.

Use this concept subtly throughout the interface.

The UI should never become gimmicky.

---

# ANIMATED BACKGROUND SYSTEM

Create a custom animated background that is actually related to Scholar Nexus.

Possible conceptual inspiration:

- citation networks
- slowly connecting research nodes
- abstract academic graphs
- knowledge pathways
- constellation-like research relationships
- moving evidence traces
- subtle document/data structures
- semantic relationships

The animation should be:

- original
- subtle
- elegant
- computationally inexpensive
- responsive
- non-distracting
- meaningful to the product

It must NOT reduce text readability.

It must NOT run heavy animation loops unnecessarily.

Prefer CSS, SVG, Canvas, or carefully optimized animation depending on which implementation best fits the existing stack.

Respect:

`prefers-reduced-motion`

Mobile devices should receive a simplified version when appropriate.

---

# MOTION DESIGN SYSTEM

Motion must exist throughout the product, but it must have a reason.

Create coherent motion behavior for:

- page transitions
- view transitions
- search interactions
- filtering
- result appearance
- panels
- modals
- dropdowns
- saved-paper interactions
- comparison selection
- tabs
- hover states
- navigation
- error feedback
- success feedback
- loading
- empty states

Use the project's existing animation capabilities where appropriate.

Motion should reinforce hierarchy and state changes.

Do NOT make every element bounce, slide or scale.

Professional motion is restrained.

---

# CUSTOM LOADING EXPERIENCE

Design a unique Scholar Nexus loading system.

Do NOT use:

- a generic spinner
- three bouncing dots
- a standard skeleton copied from a component library

Create loading behavior inspired by:

**research discovery / citation networks / knowledge traversal**

For example:

A query could visually travel through multiple knowledge nodes while sources become connected and evidence is gradually assembled.

Different loading states may be appropriate for:

- initial application loading
- searching papers
- loading another page
- generating AI analysis
- fetching citations
- opening paper details
- comparing papers
- loading saved research

Use contextual status messages where useful.

Examples conceptually:

Searching scholarly sources  
Resolving duplicate papers  
Ranking evidence  
Mapping citations  
Preparing comparison

Do not fake backend progress percentages unless real progress exists.

---

# CUSTOM CURSOR

Create a tasteful Scholar Nexus custom cursor for desktop/pointer devices.

It should relate to:

- research
- discovery
- evidence
- nodes
- citation connections

Possible conceptual direction:

a minimal research-node / targeting / connection-point cursor.

It may respond subtly when hovering:

- papers
- links
- draggable elements
- citation nodes
- interactive visualizations

Requirements:

- must not hurt usability
- must not obscure content
- must not interfere with text selection
- must not replace appropriate cursor semantics
- disable it automatically for touch devices
- support accessibility
- keep animations extremely lightweight

The result should feel premium, not gimmicky.

---

# HOME / DISCOVERY EXPERIENCE

The first screen must immediately communicate Scholar Nexus's value.

Do not build a traditional marketing homepage before users can actually use the product.

This is primarily a **research application**.

The search/discovery experience should feel central.

Create a strong visual entry point around the research query.

Search should feel powerful.

Consider intelligently presenting:

- natural-language research query
- advanced filters
- source selection
- recent investigations
- saved searches
- research suggestions
- result count
- source coverage
- useful query guidance

The screen should feel useful even before the first search.

---

# SEARCH EXPERIENCE

Redesign the entire search workflow.

The user should clearly understand:

1. what they searched
2. which sources are being queried
3. when search is running
4. what filters are active
5. how many papers were found
6. why results are ranked
7. which source each result originated from
8. whether the paper is open access
9. whether it has already been saved
10. whether it is selected for comparison

Search results should prioritize information density while remaining visually elegant.

---

# PAPER RESULT DESIGN

Redesign paper result presentation completely.

A paper result should allow the user to quickly understand:

- title
- authors
- year
- venue/source
- abstract/snippet
- citation information
- relevance
- publication source
- open-access status
- available actions

Actions may include:

- save
- compare
- open
- analyze
- inspect citations
- export
- add to collection/project

Avoid giant cards that waste vertical space.

Researchers need to scan many papers efficiently.

Create a sophisticated hierarchy.

---

# PAPER DETAILS

Paper details should feel like opening an evidence dossier.

Structure information intelligently.

Potential hierarchy:

- identity
- metadata
- abstract
- AI interpretation
- methodology
- contributions
- limitations
- citations
- related papers
- authors
- source links
- user notes

Do not bury critical metadata.

---

# COMPARE EXPERIENCE

The Compare feature is important.

Make it feel like a serious analytical workspace.

Users should easily understand:

- papers being compared
- metadata differences
- methodology differences
- datasets
- findings
- strengths
- limitations
- citations
- AI-generated synthesis where supported

Selections must survive navigation/reloads using browser persistence.

Comparison should remain usable on smaller screens.

---

# SAVED PAPERS / READING EXPERIENCE

The user's saved research should feel like their personal academic library.

Allow information to be scanned and managed efficiently.

Preserve existing available functionality while redesigning presentation.

Possible organizational concepts:

- recently saved
- collections/projects
- tagged papers
- reading status
- notes
- compare queue

Do not invent backend-dependent features unless they can actually function.

---

# CRITICAL FIX — SEARCH HISTORY & SAVED PAPER PERSISTENCE

Currently saving/history relies too heavily on backend workspace persistence and can fail when that backend path is unavailable.

For the current version, implement a **local-first browser persistence architecture**.

The application must continue allowing users to:

- save papers
- remove saved papers
- access their saved library
- store search history
- reopen previous searches
- select papers for comparison
- retain comparison state where appropriate
- maintain relevant user workspace state

even if the database/backend persistence API is unavailable.

## DO NOT simply scatter `localStorage.setItem()` around random components.

Create a clean persistence abstraction.

Recommended architecture:

`WorkspaceRepository`

with implementations/adapters such as:

- `BrowserWorkspaceRepository`
- future `RemoteWorkspaceRepository`

For browser persistence:

Prefer **IndexedDB** for structured research objects and potentially larger paper data.

Use `localStorage` only where appropriate for lightweight preferences such as:

- theme
- compact/comfortable mode
- small UI preferences
- last selected view

The application should have one authoritative local persistence layer.

Create:

- versioned storage schema
- safe serialization
- hydration logic
- error recovery
- migration support
- duplicate prevention
- corrupted-storage handling
- storage availability handling

Do not let a missing backend prevent users from saving their work.

---

# BACKEND FALLBACK BEHAVIOR

If `/api/workspace` or database persistence fails:

DO NOT show the product as unusable.

Instead:

1. continue functioning through browser persistence
2. optionally display a small non-blocking message such as:

"Saved locally on this device."

3. keep the research workflow operational

The backend can later become an optional synchronization layer.

Structure the code so future cloud synchronization can be added without rewriting the UI.

---

# LOCAL-FIRST DATA INTEGRITY

Saved items must not randomly disappear.

Implement deterministic IDs for papers where possible using appropriate identifiers such as:

- DOI
- provider paper ID
- normalized title hash

Prevent duplicated saved papers.

Search history should have reasonable retention behavior.

Persist timestamps.

Handle schema upgrades gracefully.

Never store secrets/API keys in browser storage.

---

# ERROR HANDLING

Redesign error handling globally.

No raw backend/database errors should be dumped into the interface.

Create human-friendly states for:

- source unavailable
- partial search results
- timeout
- AI analysis failure
- browser storage unavailable
- no papers found
- malformed responses
- network loss
- backend persistence unavailable

The application should degrade gracefully.

One failed academic source should not make the entire product appear broken.

---

# MICROINTERACTIONS

Add polished interactions for meaningful actions.

Examples:

Saving a paper:
the action should visually confirm that the paper has entered the research library.

Adding to compare:
the comparison workspace indicator can react.

Copying citation:
provide immediate confirmation.

Changing filters:
results should update with coherent transition behavior.

Hovering citation relationships:
connected nodes can respond.

Everything should feel intentional.

---

# NAVIGATION

Redesign navigation based on actual product workflow.

The information architecture should prioritize product tasks rather than arbitrary page names.

Ensure users can easily access the existing major areas such as:

- discovery/search
- saved reading/research
- projects/collections
- updates
- comparison or equivalent workflow
- other existing functionality discovered during repository inspection

Navigation should clearly communicate the current location.

Desktop and mobile navigation may use different patterns.

---

# RESPONSIVE DESIGN

Do NOT treat mobile as desktop squeezed into a smaller screen.

Design deliberately for:

- large desktop
- laptop
- tablet
- mobile

On mobile:

- reduce background complexity
- simplify motion where necessary
- maintain readable paper cards
- transform side panels appropriately
- ensure filters remain usable
- ensure compare remains accessible
- maintain touch target sizes
- avoid horizontal overflow

---

# ACCESSIBILITY

Production quality includes accessibility.

Implement or preserve:

- semantic HTML
- keyboard navigation
- visible focus states
- correct button/link semantics
- accessible dialogs
- ARIA labeling where required
- sufficient contrast
- screen-reader-friendly status updates
- reduced motion
- non-color-only state indicators
- proper forms and labels

Custom animations and cursor effects must NEVER reduce accessibility.

---

# PERFORMANCE

Visual ambition is welcome.

Bad performance is not.

Do not compromise performance for decoration.

Avoid:

- unnecessary rerenders
- huge animation libraries for tiny effects
- uncontrolled particle systems
- multiple permanent Canvas loops
- massive backdrop blur layers
- layout thrashing
- enormous box-shadow stacks
- unoptimized images
- hydration problems

Lazy-load expensive visualization functionality where appropriate.

Animations should generally rely on transform/opacity rather than expensive layout-changing properties.

---

# CSS QUALITY

Do not create a giant unmaintainable CSS file.

Refactor styling into a coherent system.

Use:

- design tokens
- CSS variables
- reusable utility patterns
- component variants
- reusable animation primitives
- clear naming
- logical component boundaries

Remove obsolete styling after migration.

Do not leave hundreds of unused classes from the previous theme.

---

# COMPONENT ARCHITECTURE

Avoid one enormous page component.

Create reusable product-level primitives where useful, for example:

- AppShell
- ResearchBackground
- SearchCommand
- SearchProgress
- PaperResult
- EvidenceBadge
- SourceBadge
- CitationMetric
- SaveAction
- CompareAction
- ResearchPanel
- EmptyState
- LoadingResearchGraph
- StorageStatus
- CommandPalette
- FilterPanel

These are examples, not mandatory names.

Choose architecture after examining the repository.

---

# PRESERVE AND USE THE EXISTING STACK

Do not replace the framework unnecessarily.

Work with the project's existing technologies.

Use the tools already available whenever they are appropriate rather than introducing unnecessary dependencies.

If adding a dependency, there must be a strong engineering justification.

Avoid dependency bloat.

---

# CONTENT / COPY

Rewrite weak interface copy where needed.

The language should sound:

- intelligent
- concise
- factual
- research-oriented
- professional

Avoid meaningless marketing phrases such as:

"Unlock the power of AI."

"Revolutionize your research."

"Experience the future."

"Supercharge your workflow."

Use interface language that actually helps researchers.

---

# THE PRODUCT MUST FEEL ALIVE

I want moments where the interface feels unexpectedly polished.

Examples could include:

- research-network activity during search
- intelligent source-status visualization
- satisfying saved-paper transitions
- citation graph interactions
- beautifully designed empty states
- contextual tooltips
- powerful keyboard shortcuts
- excellent transitions between research modes
- subtle visual relationships between papers

Creativity is strongly encouraged.

However:

**creativity must improve the experience.**

Do not add features merely to demonstrate animation skills.

---

# PRODUCTION QUALITY

Treat this repository as something that must actually ship.

That means:

- no placeholder content left behind
- no dead buttons
- no console errors
- no broken TypeScript
- no hydration warnings
- no inaccessible dialogs
- no broken mobile layouts
- no unfinished states
- no duplicated components
- no TODO styling
- no hard-coded demo values pretending to be real data
- no broken navigation
- no accidental backend regressions
- no fake features

---

# TEST EVERYTHING

After implementation, test the complete workflow.

At minimum verify:

### Search
- search can be executed
- results display correctly
- filters work
- loading experience works
- source failures degrade gracefully

### Saving
- paper can be saved
- saved state updates immediately
- page refresh preserves it
- reopening application preserves it
- duplicate saving does not create duplicates
- removing saved paper works

### Search history
- search is persisted
- refresh keeps history
- history item can be reopened
- history can be modified/cleared if existing product behavior supports it

### Compare
- papers can be selected
- selections persist appropriately
- compare interface works
- removing paper works

### Navigation
- every existing page works
- back/forward navigation works
- deep links work

### Responsive
- mobile
- tablet
- desktop

### Accessibility
- keyboard navigation
- focus states
- dialogs
- reduced motion

### Quality
Run:

- lint
- typecheck
- existing automated tests
- production build

Fix the problems discovered.

Do not merely tell me they exist.

---

# IMPLEMENTATION APPROACH

Work in this order.

## Phase 1 — Audit

Inspect the complete repository and understand the application.

Document internally:

- routes
- data flow
- design architecture
- workspace storage architecture
- reusable components
- APIs
- major functionality
- technical risks

Do not start randomly changing CSS before understanding the product.

## Phase 2 — Design System

Define the new:

- visual identity
- typography
- color system
- spacing
- surfaces
- interaction states
- animation language

## Phase 3 — Application Shell

Redesign:

- background
- navigation
- global layout
- typography
- loading
- cursor
- shared primitives

## Phase 4 — Product Screens

Systematically redesign every existing user-facing route and state.

Do not stop after the homepage.

## Phase 5 — Persistence Fix

Implement the local-first browser workspace architecture.

Migrate:

- saved papers
- search history
- comparison-related state
- other appropriate workspace information

## Phase 6 — Polish

Implement:

- transitions
- microinteractions
- empty states
- loading states
- error states
- responsive adjustments
- accessibility

## Phase 7 — Verification

Run the entire product.

Find visual, behavioral and engineering problems.

Fix them.

Then run production build checks.

---

# IMPORTANT AUTONOMY RULE

Do not repeatedly ask me questions like:

"What color would you like?"

"Which font do you prefer?"

"Should I use cards?"

"Would you like animations?"

Use your expertise.

You have creative freedom.

Study Scholar Nexus.

Understand what the product represents.

Then create the strongest design direction you can justify.

If multiple approaches are possible, choose the one that creates the most distinctive, coherent, usable product.

---

# QUALITY BAR

Do not optimize for:

"Looks better than before."

Optimize for:

**"This looks like a real product company spent months designing it."**

When somebody opens Scholar Nexus, I want the immediate reaction to be:

**"This is different."**

Then, after using it:

**"This is extremely well thought out."**

The interface should be memorable without sacrificing functionality.

---

# FINAL REQUIREMENT

Do not provide only recommendations, mockups, explanations or snippets.

**IMPLEMENT THE CHANGES IN THE REPOSITORY.**

Inspect the code.

Modify the components.

Create the design system.

Implement animations.

Implement the research-oriented background.

Implement the loading system.

Implement the custom cursor.

Fix local persistence.

Redesign every major interface.

Preserve working functionality.

Run the application.

Test it.

Fix issues.

Run lint/typecheck/tests/build.

Keep iterating until Scholar Nexus feels like a cohesive, production-ready research product.

Do not leave the redesign half completed.

Do not preserve old styling simply because replacing it requires more work.

Do not settle for a generic AI-generated aesthetic.

The final product must be:

**ORIGINAL.**

**AUTHENTIC.**

**FUNCTIONAL.**

**FACTUAL.**

**POLISHED.**

**FAST.**

**ACCESSIBLE.**

**MEMORABLE.**

**PRODUCTION-LEVEL.**

Push the creativity as far as possible without sacrificing engineering quality or usability.