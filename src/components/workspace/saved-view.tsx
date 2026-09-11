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
  Filter,
  Layers,
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
    const bib = bibliography(papers as any, "bib");
    downloadFile(bib, "scholar-nexus-library.bib", "text/plain");
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
    downloadFile(csv(rows), "scholar-nexus-library.csv", "text/csv");
  };

  const handleExportJson = () => {
    const json = JSON.stringify(papers, null, 2);
    downloadFile(json, "scholar-nexus-library.json", "application/json");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-5">
        <div className="hud-badge iris py-1.5 px-4 text-xs sm:text-sm font-mono tracking-wider font-semibold">
          <span className="hud-dot animate-pulse-signal" />
          <span>RESEARCH REPOSITORY // LOCAL VAULT</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display">
              Research <span className="text-[var(--color-primary-bright)]">Library</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
              Curated collection of scientific literature, citations, and evidence records cached securely for offline synthesis.
            </p>
          </div>

          {/* Multi-Format Export Buttons */}
          {papers.length > 0 && (
            <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm">
              <span className="text-slate-400 uppercase tracking-wider text-xs font-semibold mr-1 hidden sm:inline">
                EXPORT:
              </span>
              <button
                type="button"
                onClick={handleExportBibtex}
                className="btn btn-secondary h-10 px-4 text-xs sm:text-sm font-mono font-semibold"
              >
                <FileCode className="w-4 h-4 text-[var(--color-primary-bright)]" />
                <span>BibTeX</span>
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn btn-secondary h-10 px-4 text-xs sm:text-sm font-mono font-semibold"
              >
                <FileSpreadsheet className="w-4 h-4 text-[var(--color-green)]" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="btn btn-secondary h-10 px-4 text-xs sm:text-sm font-mono font-semibold"
              >
                <FileJson className="w-4 h-4 text-indigo-400" />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      {papers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="kpi-card p-5">
            <span className="kpi-label text-xs uppercase tracking-wider font-semibold text-slate-400">Saved Literature</span>
            <span className="kpi-value text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--color-primary-bright)]">{papers.length} Papers</span>
            <span className="kpi-sub text-xs sm:text-sm text-slate-300 mt-1">Curated across research workflows</span>
          </div>
          <div className="kpi-card p-5">
            <span className="kpi-label text-xs uppercase tracking-wider font-semibold text-slate-400">Cumulative Citations</span>
            <span className="kpi-value text-2xl sm:text-3xl lg:text-4xl font-black text-white">{totalCitations.toLocaleString()}</span>
            <span className="kpi-sub text-xs sm:text-sm text-slate-300 mt-1">Total citation mass in collection</span>
          </div>
          <div className="kpi-card p-5">
            <span className="kpi-label text-xs uppercase tracking-wider font-semibold text-slate-400">Local Persistence</span>
            <span className="kpi-value text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--color-green)]">Offline Ready</span>
            <span className="kpi-sub text-xs sm:text-sm text-slate-300 mt-1">Frame-0 cached in browser storage</span>
          </div>
        </div>
      )}

      {/* Filter & Sort Bar (Bracketed) */}
      {papers.length > 0 && (
        <div className="tech-card bracketed p-5 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm font-mono">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4.5 w-4.5 text-[var(--color-primary-bright)]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search library by concept, title, or author..."
              className="h-11 w-full rounded-lg border border-indigo-500/25 bg-[var(--bg-obsidian)] pl-10 pr-4 text-sm text-white placeholder:text-slate-400 focus:border-[var(--color-primary)] focus:outline-none transition-all font-sans"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 uppercase tracking-wider text-xs font-semibold">
              SORT BY:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-11 rounded-lg border border-indigo-500/25 bg-[var(--bg-obsidian)] px-3 text-sm text-white focus:border-[var(--color-primary)] focus:outline-none font-sans"
            >
              <option value="recent">Recently Added</option>
              <option value="year">Publication Year</option>
              <option value="citations">Citation Count</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* Papers Stream */}
      {filteredPapers.length > 0 ? (
        <div className="space-y-4">
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
      ) : papers.length === 0 ? (
        <div className="tech-card bracketed p-16 text-center max-w-xl mx-auto space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--bg-surface-elevated)] border border-indigo-500/30 text-[var(--color-primary-bright)] shadow-[0_0_25px_rgba(99,102,241,0.3)]">
            <Bookmark className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white font-display">
              Research Library is Empty
            </h3>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Bookmark papers from literature discovery to curate your permanent collection and access citations offline.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToDiscover}
              className="btn btn-primary h-11 px-6 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider"
            >
              <Compass className="w-4.5 h-4.5" />
              <span>DISCOVER PAPERS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="tech-card bracketed p-10 text-center text-sm text-slate-400 font-mono">
          NO PAPERS MATCH QUERY &ldquo;{filterQuery}&rdquo;
        </div>
      )}
    </div>
  );
}
