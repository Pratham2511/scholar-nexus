"use client";

import { useState } from "react";
import {
  Bookmark,
  Search,
  FileCode,
  FileSpreadsheet,
  FileJson,
  Compass,
  ArrowRight,
} from "lucide-react";
import { PaperCard, type Paper } from "./paper-card";
import { bibliography, csv } from "@/lib/workspace/exports";

interface SavedViewProps {
  papers: Paper[];
  comparedPaperIds: Set<string>;
  onToggleSave: (paper: Paper) => void;
  onToggleCompare: (paper: Paper) => void;
  onOpenReader: (paper: Paper) => void;
  onNavigateToDiscover: () => void;
  onAddToProject?: (paper: Paper) => void;
}

export function SavedView({
  papers,
  comparedPaperIds,
  onToggleSave,
  onToggleCompare,
  onOpenReader,
  onNavigateToDiscover,
  onAddToProject,
}: SavedViewProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "year" | "citations" | "title">("recent");

  const filteredPapers = papers
    .filter((p) => {
      if (!filterQuery.trim()) return true;
      const q = filterQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.authors.some((a) => a.toLowerCase().includes(q)) ||
        p.abstract.toLowerCase().includes(q) ||
        (p.venue && p.venue.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "year") return (b.year || 0) - (a.year || 0);
      if (sortBy === "citations") return (b.citationCount || 0) - (a.citationCount || 0);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return 0;
    });

  const totalCitations = papers.reduce((sum, p) => sum + (p.citationCount || 0), 0);
  const openAccessCount = papers.filter((p) => p.openAccess).length;
  const distinctVenues = new Set(
    papers.map((p) => (p.venue || "").trim().toLowerCase()).filter(Boolean),
  ).size;

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBibtex = () => {
    const bib = bibliography(papers as unknown as Parameters<typeof bibliography>[0], "bib");
    downloadFile(bib, "kivo-library.bib", "text/plain");
  };

  const handleExportCsv = () => {
    const rows = [
      ["Title", "Authors", "Year", "Venue", "DOI", "Citations", "Abstract"],
      ...papers.map((p) => [
        p.title,
        p.authors.join("; "),
        p.year ?? "",
        p.venue ?? "",
        p.doi ?? "",
        p.citationCount ?? "",
        p.abstract,
      ]),
    ];
    downloadFile(csv(rows), "kivo-library.csv", "text/csv");
  };

  const handleExportJson = () => {
    const json = JSON.stringify(papers, null, 2);
    downloadFile(json, "kivo-library.json", "application/json");
  };

  const hasPapers = papers.length > 0;
  const hasMatches = filteredPapers.length > 0;

  return (
    <div className="space-y-7">
      {/* ===== Section masthead ===== */}
      <div className="space-y-3 animate-fade-up">
        <div className="flex items-center gap-3">
          <span className="section-index">
            <span className="num">03</span> / Library
          </span>
          <span className="h-px flex-1 bg-[var(--border-dim)]" />
          <span className="hud-badge brass py-1">
            <span className="hud-dot animate-pulse-signal" />
            {papers.length} {papers.length === 1 ? "Record" : "Records"}
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-display leading-[1.08] text-[var(--text-primary)]"
          style={{ fontOpticalSizing: "auto" }}
        >
          Your saved <span className="font-serif-italic text-[var(--color-primary-bright)]">records.</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-2xl leading-relaxed">
          A personal shelf of papers you have bookmarked from discovery. Filter, sort, and export to BibTeX, CSV, or JSON — your library is persisted locally and travels with the workspace.
        </p>
      </div>

      {/* ===== Empty state ===== */}
      {!hasPapers ? (
        <div className="tech-card bracketed p-12 sm:p-16 text-center space-y-5 max-w-xl mx-auto animate-fade-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.06)] text-[var(--color-primary-bright)] shadow-[0_0_22px_var(--color-primary-glow)]">
            <Bookmark className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3
              className="text-xl sm:text-2xl font-bold font-display text-[var(--text-primary)]"
              style={{ fontOpticalSizing: "auto" }}
            >
              Your library is empty
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
              Bookmark papers from discovery to curate a permanent collection. Saved records become searchable, exportable, and ready to feed screening projects.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToDiscover}
            className="btn btn-primary h-11 px-6 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <Compass className="w-4 h-4" />
            <span>Discover literature</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* ===== KPI row ===== */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up">
            <div className="kpi-card">
              <span className="kpi-label">Records</span>
              <span className="kpi-value">{papers.length}</span>
              <span className="kpi-sub">saved in your library</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Citations</span>
              <span className="kpi-value">{totalCitations.toLocaleString()}</span>
              <span className="kpi-sub">cumulative across records</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Open Access</span>
              <span className="kpi-value">{openAccessCount}</span>
              <span className="kpi-sub">immediately reachable</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Venues</span>
              <span className="kpi-value">{distinctVenues}</span>
              <span className="kpi-sub">distinct sources</span>
            </div>
          </section>

          {/* ===== Toolbar (filter + sort + export) ===== */}
          <section className="space-y-3 animate-fade-up">
            <div className="flex items-center gap-2">
              <h3 className="section-index">
                <span className="num">03.1</span> Filter &amp; Export
              </h3>
              <span className="h-px flex-1 bg-[var(--border-dim)]" />
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {filteredPapers.length} shown
              </span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              {/* Search / filter input */}
              <div className="search-field flex items-center gap-2 px-3 py-2 flex-1 min-w-0">
                <Search className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Search by title, author, abstract, or venue…"
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[var(--text-primary)] placeholder:text-[var(--text-faint)] text-sm py-1.5"
                  aria-label="Filter library"
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery("")}
                    className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors px-1.5"
                    aria-label="Clear filter"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] hidden sm:inline">
                  Sort
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-11 rounded-md border border-[var(--border-medium)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[rgba(58, 157, 124,0.10)] transition-all font-sans cursor-pointer"
                  aria-label="Sort records"
                >
                  <option value="recent">Recently Added</option>
                  <option value="year">Publication Year</option>
                  <option value="citations">Citation Count</option>
                  <option value="title">Title (A → Z)</option>
                </select>
              </div>

              {/* Export buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBibtex}
                  className="btn btn-secondary h-11 px-3.5 text-xs font-mono font-bold uppercase tracking-wider"
                  title="Export as BibTeX"
                >
                  <FileCode className="w-4 h-4 text-[var(--color-primary-bright)]" />
                  <span className="hidden sm:inline">BibTeX</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="btn btn-emerald h-11 px-3.5 text-xs font-mono font-bold uppercase tracking-wider"
                  title="Export as CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="btn btn-secondary h-11 px-3.5 text-xs font-mono font-bold uppercase tracking-wider"
                  title="Export as JSON"
                >
                  <FileJson className="w-4 h-4 text-[var(--color-primary-bright)]" />
                  <span className="hidden sm:inline">JSON</span>
                </button>
              </div>
            </div>
          </section>

          {/* ===== Results ===== */}
          {hasMatches ? (
            <section className="space-y-4 animate-fade-up">
              <div className="flex items-center gap-2">
                <h3 className="section-index">
                  <span className="num">03.2</span> Records
                </h3>
                <span className="h-px flex-1 bg-[var(--border-dim)]" />
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {filteredPapers.length} shown
                </span>
              </div>
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filteredPapers.map((paper) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    isSaved={true}
                    isCompared={comparedPaperIds.has(paper.id)}
                    onToggleSave={onToggleSave}
                    onToggleCompare={onToggleCompare}
                    onOpenReader={onOpenReader}
                    onAddToProject={onAddToProject}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="tech-card bracketed p-10 text-center max-w-xl mx-auto space-y-3 animate-fade-up">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border-medium)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
                <Search className="w-5 h-5" />
              </div>
              <h3
                className="text-lg font-bold font-display text-[var(--text-primary)]"
                style={{ fontOpticalSizing: "auto" }}
              >
                No records match &ldquo;{filterQuery}&rdquo;
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Try a different search term, or clear the filter to see your full library.
              </p>
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="btn btn-ghost h-9 px-4 text-xs font-mono font-semibold uppercase tracking-wider"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* ===== Provenance footer ===== */}
          {hasMatches && (
            <p className="flex items-start gap-2 font-mono text-[10px] text-[var(--text-muted)] leading-relaxed max-w-3xl">
              <Bookmark className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
              Your library is stored locally in this browser. Exports include only records listed above; full-text PDFs are not bundled. Remove a record via the bookmark toggle on any card.
            </p>
          )}
        </>
      )}
    </div>
  );
}
