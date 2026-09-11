"use client";

import { useState, type FormEvent } from "react";
import {
  Search,
  SlidersHorizontal,
  History,
  Database,
  ArrowRight,
  Globe2,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Compass,
  Layers,
  ShieldCheck,
  KeyRound,
  Sparkle,
} from "lucide-react";
import type { Workspace } from "@/lib/workspace/schema";
import { PaperCard, type Paper } from "./paper-card";
import { QuantumLoader } from "../ui/page-loader";

/**
 * Providers aligned to the academic orchestrator. The three default sources
 * (Crossref, arXiv, Europe PMC) operate without API keys; the rest require a
 * configured server credential and are shown but disabled in local mode.
 */
export const AVAILABLE_PROVIDERS = [
  { id: "Crossref", label: "Crossref", scope: "DOI Registry", needsKey: false },
  { id: "arXiv", label: "arXiv", scope: "Preprints", needsKey: false },
  { id: "Europe PMC", label: "Europe PMC", scope: "Open Access", needsKey: false },
  { id: "OpenAlex", label: "OpenAlex", scope: "Global Index", needsKey: true, key: "OPENALEX_API_KEY" },
  { id: "Semantic Scholar", label: "Semantic Scholar", scope: "Citation Graph", needsKey: true, key: "SEMANTIC_SCHOLAR_API_KEY" },
  { id: "IEEE Xplore", label: "IEEE Xplore", scope: "Applied Tech", needsKey: true, key: "IEEE_API_KEY" },
  { id: "CORE", label: "CORE", scope: "Open Repositories", needsKey: true, key: "CORE_API_KEY" },
] as const;

export interface SearchFilters {
  yearFrom?: number;
  yearTo?: number;
  openAccess?: boolean;
  minCitations?: number;
  sort?: "relevance" | "year" | "citations";
}

interface DiscoverViewProps {
  query: string;
  setQuery: (q: string) => void;
  selectedProviders: string[];
  setSelectedProviders: (p: string[]) => void;
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  onSearch: (q: string) => void;
  isSearching: boolean;
  results: Paper[];
  diagnostics?: Array<{ source: string; status?: string; error?: string; durationMs: number }>;
  recentSearches: Workspace["searches"];
  savedPaperIds: Set<string>;
  comparedPaperIds: Set<string>;
  onToggleSave: (paper: Paper) => void;
  onToggleCompare: (paper: Paper) => void;
  onOpenReader: (paper: Paper) => void;
  onAddToProject?: (paper: Paper) => void;
}

const SUGGESTED_TOPICS = [
  { title: "Temporal Graph Neural Networks", query: "temporal graph neural networks dynamic graph representation learning", tag: "Graph Intelligence" },
  { title: "Retrieval-Augmented Generation", query: "retrieval augmented generation hallucination mitigation factuality", tag: "Language Models" },
  { title: "Diffusion Models for Structural Biology", query: "diffusion models protein structure prediction conformation dynamics", tag: "Biomedical AI" },
  { title: "Quantum Error Correction", query: "quantum error correction surface codes fault tolerant threshold", tag: "Quantum Computing" },
];

export function DiscoverView({
  query,
  setQuery,
  selectedProviders,
  setSelectedProviders,
  filters,
  setFilters,
  onSearch,
  isSearching,
  results,
  diagnostics,
  recentSearches,
  savedPaperIds,
  comparedPaperIds,
  onToggleSave,
  onToggleCompare,
  onOpenReader,
  onAddToProject,
}: DiscoverViewProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const toggleProvider = (id: string, disabled: boolean) => {
    if (disabled) return;
    if (selectedProviders.includes(id)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter((p) => p !== id));
      }
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };

  const hasResults = results.length > 0;
  const hasSearched = isSearching || hasResults || (diagnostics && diagnostics.length > 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* ============ LEFT RAIL (widescreen) ============ */}
      <aside className="hidden xl:block xl:col-span-3 space-y-6 sticky top-40">
        {/* Providers */}
        <section className="tech-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-index"><span className="num">A.</span> Repositories</h3>
            <Database className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="space-y-2">
            {AVAILABLE_PROVIDERS.map((p) => {
              const active = selectedProviders.includes(p.id);
              const disabled = p.needsKey;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProvider(p.id, disabled)}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left transition-all ${
                    disabled
                      ? "border-[var(--border-dim)] opacity-50 cursor-not-allowed"
                      : active
                        ? "border-[var(--color-primary)] bg-[rgba(58, 157, 124,0.10)]"
                        : "border-[var(--border-dim)] hover:border-[var(--border-medium)] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        disabled ? "bg-[var(--text-faint)]" : active ? "bg-[var(--color-primary)] shadow-[0_0_6px_var(--color-primary)]" : "bg-[var(--text-faint)]"
                      }`}
                    />
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">{p.label}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{p.scope}</div>
                    </div>
                  </div>
                  {disabled ? (
                    <KeyRound className="w-3.5 h-3.5 text-[var(--text-faint)]" />
                  ) : active ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="font-mono text-[10px] text-[var(--text-muted)] leading-relaxed">
            Three repositories operate without keys. Key-gated sources are disabled in local mode.
          </p>
        </section>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <section className="tech-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="section-index"><span className="num">B.</span> Recent</h3>
              <History className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {recentSearches.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setQuery(s.query);
                    onSearch(s.query);
                  }}
                  className="w-full text-left rounded-md px-2.5 py-2 hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="text-[12.5px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] line-clamp-2 leading-snug">{s.query}</div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-2">
                    <span>{(s.papers || []).length} records</span>
                    <span className="text-[var(--text-faint)]">·</span>
                    <span>{new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </aside>

      {/* ============ MAIN COLUMN ============ */}
      <div className="xl:col-span-9 space-y-7">
        {/* Section masthead */}
        <div className="space-y-3 animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="section-index"><span className="num">01</span> / Discover</span>
            <span className="h-px flex-1 bg-[var(--border-dim)]" />
            <span className="hud-badge brass py-1">
              <span className="hud-dot animate-pulse-signal" />
              {selectedProviders.length} Repositories
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-display leading-[1.08] text-[var(--text-primary)]" style={{ fontOpticalSizing: "auto" }}>
            Find the literature <span className="font-serif-italic text-[var(--color-primary-bright)]">that matters.</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-base max-w-2xl leading-relaxed">
            Search by topic, quoted phrase, title, DOI, or arXiv ID. Results are retrieved directly from upstream scholarly repositories and ranked by relevance — no black boxes, no model-generated records.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="search-field p-2 sm:p-2.5 flex items-center gap-2 animate-fade-up">
          <div className="pl-3 text-[var(--color-primary)]">
            <Search className="w-5 h-5" />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a topic, phrase, DOI, or arXiv ID…"
            className="flex-1 bg-transparent border-0 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-faint)] text-base sm:text-lg py-2.5"
            aria-label="Search query"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`hidden sm:inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-mono font-medium transition-all ${
              showFilters
                ? "border-[var(--color-primary)] text-[var(--color-primary-bright)] bg-[rgba(58, 157, 124,0.08)]"
                : "border-[var(--border-medium)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="btn btn-primary h-11 px-5 sm:px-7 text-sm font-mono font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? "Searching" : "Search"}
            {!isSearching && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Mobile provider chips */}
        <div className="xl:hidden flex flex-wrap gap-1.5">
          {AVAILABLE_PROVIDERS.map((p) => {
            const active = selectedProviders.includes(p.id);
            const disabled = p.needsKey;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleProvider(p.id, disabled)}
                disabled={disabled}
                className={`hud-badge py-1 px-2.5 text-[10px] ${
                  disabled ? "opacity-40 cursor-not-allowed" : active ? "brass" : ""
                }`}
              >
                {p.label}
                {active && !disabled && <CheckCircle2 className="w-3 h-3" />}
              </button>
            );
          })}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <section className="tech-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Year from</span>
              <input
                type="number"
                value={filters.yearFrom ?? ""}
                onChange={(e) => setFilters({ ...filters, yearFrom: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="1990"
                className="bg-[var(--bg-obsidian)] border border-[var(--border-dim)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Year to</span>
              <input
                type="number"
                value={filters.yearTo ?? ""}
                onChange={(e) => setFilters({ ...filters, yearTo: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="2025"
                className="bg-[var(--bg-obsidian)] border border-[var(--border-dim)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Min citations</span>
              <input
                type="number"
                value={filters.minCitations ?? ""}
                onChange={(e) => setFilters({ ...filters, minCitations: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="0"
                className="bg-[var(--bg-obsidian)] border border-[var(--border-dim)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Sort by</span>
              <select
                value={filters.sort ?? "relevance"}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value as SearchFilters["sort"] })}
                className="bg-[var(--bg-obsidian)] border border-[var(--border-dim)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="relevance">Relevance</option>
                <option value="year">Newest first</option>
                <option value="citations">Most cited</option>
              </select>
            </label>
            <label className="flex items-center gap-2 col-span-2 sm:col-span-4 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.openAccess ?? false}
                onChange={(e) => setFilters({ ...filters, openAccess: e.target.checked })}
                className="accent-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">Open access only</span>
            </label>
          </section>
        )}

        {/* Suggested topics (when no search yet) */}
        {!hasSearched && (
          <section className="space-y-3 animate-fade-up">
            <h3 className="section-index flex items-center gap-2"><Sparkle className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Suggested lines of inquiry</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUGGESTED_TOPICS.map((t) => (
                <button
                  key={t.title}
                  type="button"
                  onClick={() => {
                    setQuery(t.query);
                    onSearch(t.query);
                  }}
                  className="paper-card bracketed text-left p-5 group"
                >
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-primary)] mb-2">{t.tag}</div>
                  <div className="text-base font-semibold text-[var(--text-primary)] font-display leading-snug group-hover:text-[var(--color-primary-bright)] transition-colors" style={{ fontOpticalSizing: "auto" }}>{t.title}</div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                    <span>Run search</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Searching state */}
        {isSearching && (
          <div className="tech-card p-12 flex flex-col items-center gap-4">
            <QuantumLoader size="lg" label="Querying scholarly repositories…" />
            <p className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
              Retrieving · deduplicating · ranking
            </p>
          </div>
        )}

        {/* Diagnostics */}
        {!isSearching && diagnostics && diagnostics.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="section-index">Source Telemetry</h3>
              <span className="h-px flex-1 bg-[var(--border-dim)]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {diagnostics.map((d) => {
                const ok = d.status === "success" || d.status === "empty";
                const partial = d.status === "partial";
                const unconfigured = d.status === "unconfigured";
                return (
                  <div
                    key={d.source}
                    className={`rounded-md border px-3 py-2.5 flex items-start gap-2.5 ${
                      ok
                        ? "border-[var(--border-emerald-dim)] bg-[rgba(107,168,136,0.05)]"
                        : unconfigured
                          ? "border-[var(--border-dim)] bg-white/[0.02]"
                          : "border-[var(--border-red-dim)] bg-[rgba(224,104,90,0.05)]"
                    }`}
                  >
                    {ok ? <CheckCircle2 className="w-4 h-4 text-[var(--color-green)] mt-0.5 shrink-0" />
                      : unconfigured ? <KeyRound className="w-4 h-4 text-[var(--text-faint)] mt-0.5 shrink-0" />
                      : partial ? <AlertTriangle className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" />
                        : <XCircle className="w-4 h-4 text-[var(--color-red)] mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{d.source}</span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">{d.durationMs}ms</span>
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                        {d.status ?? "—"}
                      </div>
                      {d.error && <div className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">{d.error}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Results summary strip — single, quiet line (no breadcrumb soup) */}
        {!isSearching && hasResults && diagnostics && diagnostics.length > 0 && (
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="kpi-card !bg-transparent !border-[var(--border-dim)]">
              <span className="kpi-label">Records</span>
              <span className="kpi-value">{results.length}</span>
              <span className="kpi-sub">in this snapshot</span>
            </div>
            <div className="kpi-card !bg-transparent !border-[var(--border-dim)]">
              <span className="kpi-label">Sources Live</span>
              <span className="kpi-value text-[var(--color-green-bright)]">{diagnostics?.filter((d) => d.status === "success").length ?? 0}<span className="text-[var(--text-faint)] text-base font-normal">/{diagnostics?.length ?? 0}</span></span>
              <span className="kpi-sub">responded successfully</span>
            </div>
            <div className="kpi-card !bg-transparent !border-[var(--border-dim)]">
              <span className="kpi-label">Open Access</span>
              <span className="kpi-value">{results.filter((r) => r.openAccess).length}</span>
              <span className="kpi-sub">immediately reachable</span>
            </div>
            <div className="kpi-card !bg-transparent !border-[var(--border-dim)]">
              <span className="kpi-label">With PDF</span>
              <span className="kpi-value">{results.filter((r) => r.pdfLink || r.identifiers?.arxiv).length}</span>
              <span className="kpi-sub">direct full-text</span>
            </div>
          </section>
        )}

        {/* Results list */}
        {!isSearching && hasResults && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]" style={{ fontOpticalSizing: "auto" }}>
                Results
              </h3>
              <span className="font-mono text-[11px] tracking-wider text-[var(--text-muted)] uppercase">
                Showing {results.length} {results.length === 1 ? "record" : "records"}
              </span>
            </div>
            <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {results.map((paper) => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  isSaved={savedPaperIds.has(paper.id)}
                  isCompared={comparedPaperIds.has(paper.id)}
                  onToggleSave={onToggleSave}
                  onToggleCompare={onToggleCompare}
                  onOpenReader={onOpenReader}
                  onAddToProject={onAddToProject}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty after search */}
        {!isSearching && hasSearched && !hasResults && (
          <div className="tech-card bracketed p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.06)] text-[var(--color-primary-bright)]">
              <Compass className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold font-display text-[var(--text-primary)]">No records returned</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Every selected source returned an empty or failed snapshot. Try a broader phrase, different repositories, or relax the filters.
              </p>
            </div>
          </div>
        )}

        {/* Provenance footer note */}
        {!isSearching && hasResults && (
          <p className="flex items-start gap-2 font-mono text-[10px] text-[var(--text-muted)] leading-relaxed max-w-3xl">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-green)] shrink-0 mt-0.5" />
            Bounded snapshot of up to 50 relevance-ordered records per source, deduplicated and filtered locally. Counts are not global literature totals. Missing metadata cannot satisfy a hard filter.
          </p>
        )}
      </div>
    </div>
  );
}
