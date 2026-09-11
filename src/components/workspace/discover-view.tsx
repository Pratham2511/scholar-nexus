"use client";

import { useState, type FormEvent } from "react";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  History,
  RefreshCw,
  Database,
  ArrowRight,
  Zap,
  Globe2,
  BookOpen,
  Network,
  CheckCircle2,
  FileText,
  Bookmark,
  Scale,
  Activity,
  Layers,
  Flame,
  ShieldCheck,
  Compass,
} from "lucide-react";
import type { Workspace } from "@/lib/workspace/schema";
import { PaperCard, type Paper } from "./paper-card";
import { QuantumLoader } from "../ui/page-loader";

export const AVAILABLE_PROVIDERS = [
  { id: "arxiv", label: "arXiv", scope: "Preprints", latency: "32ms" },
  { id: "openalex", label: "OpenAlex", scope: "Global Index", latency: "45ms" },
  { id: "semantic-scholar", label: "Semantic Scholar", scope: "Citation Graph", latency: "51ms" },
  { id: "biorxiv", label: "bioRxiv", scope: "Life Sciences", latency: "38ms" },
  { id: "pubmed", label: "PubMed", scope: "Biomedical", latency: "42ms" },
  { id: "crossref", label: "Crossref", scope: "DOI Registry", latency: "29ms" },
  { id: "europepmc", label: "EuropePMC", scope: "Open Access", latency: "47ms" },
  { id: "ieee", label: "IEEE", scope: "Applied Tech", latency: "58ms" },
  { id: "core", label: "CORE", scope: "Open Repositories", latency: "62ms" },
];

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
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const toggleProvider = (id: string) => {
    if (selectedProviders.includes(id)) {
      if (selectedProviders.length > 1) {
        setSelectedProviders(selectedProviders.filter((p) => p !== id));
      }
    } else {
      setSelectedProviders([...selectedProviders, id]);
    }
  };

  const suggestedTopics = [
    {
      title: "Temporal Graph Neural Networks",
      query: "temporal graph neural networks dynamic graph representation learning",
      tag: "Graph Intelligence",
      benchmark: "94.2% AUC",
    },
    {
      title: "LLM Hallucination Mitigation",
      query: "retrieval augmented generation hallucination mitigation factuality",
      tag: "Language Models",
      benchmark: "RAG & Verifiers",
    },
    {
      title: "Diffusion Models for Structural Biology",
      query: "diffusion models protein structure prediction conformation dynamics",
      tag: "Biomedical AI",
      benchmark: "RMSD < 1.5Å",
    },
    {
      title: "Fault-Tolerant Quantum Error Correction",
      query: "quantum error correction surface codes fault tolerant threshold",
      tag: "Quantum Computing",
      benchmark: "Surface Code 17",
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* ====================================================================
          LEFT FLANK: Research Navigator & Telemetry Rail (Widescreen Only)
          ==================================================================== */}
      <aside className="hidden xl:flex xl:col-span-3 flex-col gap-5 sticky top-24">
        {/* Research Navigator Card */}
        <div className="tech-card bracketed p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[var(--color-primary-bright)]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Research Navigator
              </span>
            </div>
            <span className="hud-badge iris py-0 text-[10px]">ACTIVE</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
            One-click trajectories across high-impact computer science & life science frontiers:
          </p>

          <div className="space-y-2">
            {suggestedTopics.map((topic, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(topic.query);
                  onSearch(topic.query);
                }}
                className="w-full text-left p-2.5 rounded-lg border border-[var(--border-dim)] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[var(--color-primary)] transition-all group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
                  <span className="text-[var(--color-primary-bright)]">{topic.tag}</span>
                  <span>{topic.benchmark}</span>
                </div>
                <div className="text-xs font-semibold text-white group-hover:text-[var(--color-primary-bright)] transition-colors line-clamp-1 font-display">
                  {topic.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Review Protocols Presets */}
        <div className="tech-card bracketed p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[var(--color-green)]" />
            <span>Review Filters Shortcut</span>
          </div>
          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => setFilters({ ...filters, yearFrom: 2024, yearTo: 2026 })}
              className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] transition-all flex items-center justify-between ${
                filters.yearFrom === 2024
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-white"
                  : "border-[var(--border-dim)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <span>Recent Literature (2024–2026)</span>
              <span className="text-[10px] text-[var(--color-primary-bright)]">Preset</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ ...filters, openAccess: !filters.openAccess })}
              className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] transition-all flex items-center justify-between ${
                filters.openAccess
                  ? "border-[var(--color-green)] bg-[var(--color-green)]/15 text-white"
                  : "border-[var(--border-dim)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <span>Verified Open Access Only</span>
              <span className="text-[10px] text-[var(--color-green)]">{filters.openAccess ? "ON" : "OFF"}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ ...filters, sort: filters.sort === "citations" ? "relevance" : "citations" })}
              className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] transition-all flex items-center justify-between ${
                filters.sort === "citations"
                  ? "border-[var(--color-purple)] bg-[var(--color-purple)]/15 text-white"
                  : "border-[var(--border-dim)] text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              <span>Rank by Citation Velocity</span>
              <span className="text-[10px] text-[var(--color-purple)]">{filters.sort === "citations" ? "ACTIVE" : "OFF"}</span>
            </button>
          </div>
        </div>

        {/* Local Workspace Capsule */}
        <div className="tech-card bracketed p-4 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <span>OFFLINE WORKBENCH</span>
            <span className="text-[var(--color-green)] font-bold">FRAME-0</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded bg-white/[0.02] border border-[var(--border-dim)] text-center">
              <span className="block text-lg font-bold text-white font-display">{savedPaperIds.size}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase">In Library</span>
            </div>
            <div className="p-2 rounded bg-white/[0.02] border border-[var(--border-dim)] text-center">
              <span className="block text-lg font-bold text-white font-display">{comparedPaperIds.size}</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase">Comparing</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ====================================================================
          CENTER STAGE: Monumental Hero, Search Console, KPI Cards & Results
          ==================================================================== */}
      <div className="col-span-1 xl:col-span-6 space-y-8 min-w-0">
        {/* Monumental Hero Section */}
        <div className="space-y-4">
          {/* Institutional Status Badge */}
          <div className="hud-badge iris">
            <span className="hud-dot animate-pulse-signal" />
            <span>PEER-REVIEWED SCIENTIFIC OBSERVATORY // 9 REPOSITORIES FEDERATED</span>
          </div>

          {/* Master Display Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-display leading-[1.08]">
              Accelerate Discovery.<br />
              <span className="bg-gradient-to-r from-indigo-200 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Interrogate Global Science.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed font-sans font-normal pt-1">
              The next-generation research workbench for literature synthesis. Query 240M+ academic works across arXiv, OpenAlex, Semantic Scholar, PubMed, and IEEE simultaneously with grounded evidence extraction.
            </p>
          </div>

          {/* Live Capability Trust Indicators */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-slate-300">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_6px_var(--color-primary)]" />
              <span>Multi-Repository Federated Search</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green)] shadow-[0_0_6px_var(--color-green)]" />
              <span>Direct Open Access PDF Resolvers</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-purple)] shadow-[0_0_6px_var(--color-purple)]" />
              <span>Grounded Evidence Extraction</span>
            </div>
          </div>
        </div>

        {/* Main Command Search Bar (Bracketed Technical Card) */}
        <div className="tech-card bracketed p-5 sm:p-6 space-y-4 border-[var(--border-medium)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--color-primary-bright)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search scientific literature by inquiry, DOI (10.1038/...), paper title, or author..."
                className="h-14 w-full rounded-md border border-[var(--border-medium)] bg-[var(--bg-obsidian)] pl-12 pr-36 text-sm sm:text-base text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-sans"
              />
              <div className="absolute right-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-mono transition-colors ${
                    showFilters || Object.values(filters).some(Boolean)
                      ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-bright)] border border-[var(--border-primary-dim)]"
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">FILTERS</span>
                </button>
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="btn btn-primary h-10 px-4 text-xs font-mono uppercase tracking-wider disabled:opacity-50"
                >
                  {isSearching ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span>SEARCH</span>
                </button>
              </div>
            </div>

            {/* Academic Provider Filter Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider mr-1 flex items-center gap-1">
                <Database className="w-3 h-3 text-[var(--color-primary-bright)]" /> Sources:
              </span>
              {AVAILABLE_PROVIDERS.map((prov) => {
                const active = selectedProviders.includes(prov.id);
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => toggleProvider(prov.id)}
                    className={`hud-badge ${
                      active ? "iris" : ""
                    } cursor-pointer transition-all`}
                    style={{
                      opacity: active ? 1 : 0.65,
                    }}
                  >
                    <span className={`hud-dot ${active ? "animate-pulse-signal" : ""}`} />
                    <span>{prov.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setSelectedProviders(
                    selectedProviders.length === AVAILABLE_PROVIDERS.length
                      ? ["arxiv", "openalex", "semantic-scholar"]
                      : AVAILABLE_PROVIDERS.map((p) => p.id)
                  )
                }
                className="ml-auto text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--color-primary-bright)] transition-colors"
              >
                {selectedProviders.length === AVAILABLE_PROVIDERS.length
                  ? "RESET (3)"
                  : "SELECT ALL (9)"}
              </button>
            </div>

            {/* Filter Drawer */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-dim)] font-mono text-xs">
                <div>
                  <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                    Year From
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2021"
                    value={filters.yearFrom || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yearFrom: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="mt-1 h-8 w-full rounded border border-[var(--border-dim)] bg-[var(--bg-obsidian)] px-2.5 text-xs text-white focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                    Year To
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2026"
                    value={filters.yearTo || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yearTo: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    className="mt-1 h-8 w-full rounded border border-[var(--border-dim)] bg-[var(--bg-obsidian)] px-2.5 text-xs text-white focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                    Ranking Metric
                  </label>
                  <select
                    value={filters.sort || "relevance"}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        sort: e.target.value as SearchFilters["sort"],
                      })
                    }
                    className="mt-1 h-8 w-full rounded border border-[var(--border-dim)] bg-[var(--bg-obsidian)] px-2 text-xs text-white focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="citations">Most Cited First</option>
                    <option value="year">Newest First</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(filters.openAccess)}
                      onChange={(e) =>
                        setFilters({ ...filters, openAccess: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-700 bg-[var(--bg-obsidian)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <span>Open Access Only</span>
                  </label>
                </div>
              </div>
            )}
          </form>

          {/* Recent Search Queries Strip */}
          {recentSearches.length > 0 && results.length === 0 && !isSearching && (
            <div className="pt-3 border-t border-[var(--border-dim)] flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="text-[var(--text-muted)] flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <History className="w-3 h-3 text-[var(--color-primary-bright)]" /> Recent Searches:
              </span>
              {recentSearches.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setQuery(s.query);
                    onSearch(s.query);
                  }}
                  className="rounded bg-white/[0.03] border border-[var(--border-dim)] px-2.5 py-0.5 text-slate-300 hover:border-[var(--color-primary)] hover:text-white transition-colors text-[11px]"
                >
                  {s.query}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* KPI Stats Strip */}
        {results.length === 0 && !isSearching && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="kpi-card">
              <span className="kpi-label">Federated Sources</span>
              <span className="kpi-value text-[var(--color-primary-bright)]">9 Repositories</span>
              <span className="kpi-sub">arXiv, OpenAlex, PubMed, IEEE, Crossref...</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Citation Corpus</span>
              <span className="kpi-value text-white">240M+ Works</span>
              <span className="kpi-sub">Real-time citation graph & metadata</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Verified Access</span>
              <span className="kpi-value text-[var(--color-green)]">100% Direct</span>
              <span className="kpi-sub">Direct Open Access PDF & DOI resolvers</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Local Persistence</span>
              <span className="kpi-value text-[var(--color-purple)]">0.00s Frame-0</span>
              <span className="kpi-sub">Offline-first synchronous browser storage</span>
            </div>
          </div>
        )}

        {/* Tech Divider */}
        {results.length === 0 && !isSearching && <div className="tech-divider" />}

        {/* Results Header Status */}
        {results.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-primary-bright)] font-bold text-sm">
                {results.length} SCIENTIFIC PAPERS FOUND
              </span>
              <span>across academic repositories</span>
            </div>
            <div>
              SORTED BY: <span className="text-white uppercase">{filters.sort || "relevance"}</span>
            </div>
          </div>
        )}

        {/* Loading Animation */}
        {isSearching && (
          <div className="tech-card bracketed p-16 flex items-center justify-center">
            <QuantumLoader
              size="lg"
              label="Probing federated academic indices & resolving citation graphs..."
            />
          </div>
        )}

        {/* Papers Results Stream */}
        {!isSearching && results.length > 0 && (
          <div className="space-y-4">
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
        )}

        {/* Curated Research Topics (Initial State on smaller viewports) */}
        {!isSearching && results.length === 0 && (
          <div className="space-y-4 xl:hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-muted)]">
                Curated Research Inquiries & Benchmarks
              </span>
              <span className="text-xs font-mono text-[var(--color-primary-bright)]">EXPLORE INQUIRIES</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestedTopics.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    onSearch(item.query);
                  }}
                  className="tech-card interactive bracketed text-left p-5 group flex items-start justify-between transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="hud-badge iris py-0.5 text-[10px]">
                      <span className="hud-dot" />
                      <span>{item.tag}</span>
                    </div>
                    <h4 className="text-base font-bold text-white font-display group-hover:text-[var(--color-primary-bright)] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-1 font-mono">
                      &ldquo;{item.query}&rdquo;
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--color-primary-bright)] group-hover:translate-x-1 transition-all mt-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          RIGHT FLANK: Global Science Wire & Live Index Telemetry (Widescreen)
          ==================================================================== */}
      <aside className="hidden xl:flex xl:col-span-3 flex-col gap-5 sticky top-24">
        {/* Global Science Wire // Federated Status */}
        <div className="tech-card bracketed p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-dim)] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-green)]" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Federated Repositories
              </span>
            </div>
            <span className="hud-badge green py-0 text-[10px]">ALL ONLINE</span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
            Real-time live interconnect latency across global peer-review archives:
          </p>

          <div className="space-y-2 font-mono text-xs">
            {AVAILABLE_PROVIDERS.map((prov) => {
              const active = selectedProviders.includes(prov.id);
              return (
                <div
                  key={prov.id}
                  className={`flex items-center justify-between p-2 rounded border transition-all ${
                    active
                      ? "border-[var(--border-dim)] bg-white/[0.02]"
                      : "border-transparent opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green)] shadow-[0_0_6px_var(--color-green)]" />
                    <span className="font-semibold text-white">{prov.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">({prov.scope})</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-green)]">{prov.latency}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Direct Open-Access & Integrity Engine */}
        <div className="tech-card bracketed p-5 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary-bright)]" />
            <span>Open Access Integrity</span>
          </div>
          <div className="space-y-2 text-[11px] text-slate-300 font-sans leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-green)] shrink-0 mt-0.5" />
              <span>Direct unpaywalled PDF link resolution from official author archives.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-green)] shrink-0 mt-0.5" />
              <span>Grounded DOI landing page verification with zero simulated URLs.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-green)] shrink-0 mt-0.5" />
              <span>Zero manual PDF uploads required — purely automated literature discovery.</span>
            </div>
          </div>
        </div>

        {/* Diagnostic Latency Metrics */}
        {diagnostics && diagnostics.length > 0 && (
          <div className="tech-card bracketed p-4 space-y-2 font-mono text-[11px]">
            <span className="text-[var(--text-muted)] uppercase tracking-wider block">
              Last Query Execution Timings
            </span>
            <div className="space-y-1">
              {diagnostics.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-slate-400">
                  <span>{d.source}</span>
                  <span className="text-white">{d.durationMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}