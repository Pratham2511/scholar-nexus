# Contributing to ScholarNexus

Thanks for your interest in improving ScholarNexus! This guide will help you get started.

## Development Setup

```bash
# 1. Clone & install
git clone https://github.com/Pratham2511/scholar-nexus.git
cd scholar-nexus
bun install   # or: npm install

# 2. Set up environment
cp .env.example .env
# Edit .env if you need a non-default database URL or API keys

# 3. Initialize the database
bun run db:push    # creates SQLite tables
bun run db:generate

# 4. Start the dev server
bun run dev        # http://localhost:3000
```

## Code Style

- **TypeScript everywhere** — no plain JS, no `any` unless absolutely necessary.
- **Strict types** for all API request/response bodies.
- Use **named exports** (not default exports) for components and utilities.
- Follow the existing file layout:
  - `src/lib/` for shared logic (no React imports)
  - `src/components/` for React components
  - `src/app/api/` for API routes (one folder per resource)
  - `src/store/` for Zustand stores
- Keep functions **under 200 lines**; split into smaller helpers if longer.
- Add a JSDoc comment to any exported function that isn't self-explanatory.

## Before Submitting a PR

1. **Lint must pass:** `bun run lint`
2. **Type-check must pass:** `bunx tsc --noEmit`
3. **Build must pass:** `bun run build`
4. **Don't commit the database file** (`*.db`) — it is gitignored.
5. **Don't commit `.env`** — use `.env.example` for new variables.
6. **Don't add new dependencies** without justification.

## Security

If you discover a security vulnerability, **please do not open a public issue**.
Instead, email the maintainer directly or open a private security advisory on GitHub.

Specifically:
- Never bypass the SSRF guard in `src/lib/security.ts`.
- Never disable the rate limiter on AI endpoints.
- Never log full request bodies (they may contain user content).
- Always validate and sanitize input on new API routes using the helpers in
  `src/lib/security.ts` (`readJsonBody`, `truncate`, `checkRateLimit`).

## Areas That Need Help

- More academic source adapters (DBLP, Springer, ACM Digital Library)
- Better deduplication (fuzzy title matching, ORCID-based author merge)
- Tests (Vitest + Playwright)
- Internationalization (i18n) beyond English
- A proper auth layer (NextAuth + multiple providers) to replace the local demo user
