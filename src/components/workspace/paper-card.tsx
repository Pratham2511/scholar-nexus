"use client";

import { useState } from "react";
import {
  FileText,
  Bookmark,
  Scale,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import type { Workspace } from "@/lib/workspace/schema";
import { resolvePaperAccess } from "./source-resolver";

export type Paper = Workspace["papers"][number];

interface PaperCardProps {
  paper: Paper;
  isSaved: boolean;
  isCompared: boolean;
  onToggleSave: (paper: Paper) => void;
  onToggleCompare: (paper: Paper) => void;
  onOpenReader: (paper: Paper) => void;
  onAddToProject?: (paper: Paper) => void;
}

export function PaperCard({
  paper,
  isSaved,
  isCompared,
  onToggleSave,
  onToggleCompare,
  onOpenReader,
  onAddToProject,
}: PaperCardProps) {
  const [expanded, setExpanded] = useState(false);
  const access = resolvePaperAccess(paper);

  const authorsDisplay =
    paper.authors.length > 0
      ? paper.authors.slice(0, 4).join(", ") +
        (paper.authors.length > 4 ? ` et al. (+${paper.authors.length - 4})` : "")
      : "Unknown authors";

  const hasIntegrityWarning =
    paper.integrityNotices && paper.integrityNotices.length > 0;

  return (
    <article
      className={`tech-card interactive bracketed p-6 sm:p-7 space-y-3 transition-all ${
        isSaved ? "border-[var(--color-primary)]/40 bg-[var(--bg-surface-elevated)]" : ""
      }`}
    >
      {/* Top Metadata Badges Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Publication Year */}
          {paper.year && (
            <span className="rounded-md bg-white/[0.08] border border-indigo-500/20 px-2.5 py-1 text-slate-200 font-bold">
              {paper.year}
            </span>
          )}

          {/* Publication Venue */}
          {paper.venue && (
            <span
              className="max-w-[280px] truncate rounded-md bg-white/[0.04] border border-indigo-500/20 px-2.5 py-1 text-slate-300 font-medium"
              title={paper.venue}
            >
              {paper.venue}
            </span>
          )}

          {/* Citations HUD Badge */}
          {paper.citationCount !== null && (
            <span className="hud-badge iris py-1 px-2.5 text-xs font-semibold">
              <span className="hud-dot" />
              <span>{paper.citationCount} {paper.citationCount === 1 ? "CITE" : "CITATIONS"}</span>
            </span>
          )}

          {/* Source Access HUD Badge */}
          <span
            className={`hud-badge ${
              access.accessBadge.variant === "emerald"
                ? "green"
                : "iris"
            } py-1 px-2.5 text-xs font-semibold`}
            title={access.accessBadge.tooltip}
          >
            {access.hasDirectPdf && <span className="hud-dot" />}
            <span>{access.accessBadge.label}</span>
          </span>

          {/* Integrity Flag */}
          {hasIntegrityWarning && (
            <span className="hud-badge red py-1 px-2.5 text-xs font-semibold" title="Paper retracted or flagged">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>FLAGGED</span>
            </span>
          )}
        </div>

        {/* Quick Action Toggles (Save & Compare) */}
        <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
          {onAddToProject && (
            <button
              type="button"
              onClick={() => onAddToProject(paper)}
              className="rounded-lg border border-indigo-500/20 p-2 text-slate-400 hover:border-[var(--color-primary)] hover:text-white hover:bg-white/[0.04] transition-colors"
              title="Add to Screening Project"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleCompare(paper)}
            className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
              isCompared
                ? "border-[var(--color-purple)] bg-[var(--color-purple)]/20 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-purple)] hover:text-white hover:bg-white/[0.04]"
            }`}
            title="Compare paper side-by-side"
          >
            <Scale className="w-4 h-4 inline mr-1.5" />
            <span>{isCompared ? "COMPARING" : "COMPARE"}</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleSave(paper)}
            className={`rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
              isSaved
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                : "border-indigo-500/20 text-slate-300 hover:border-[var(--color-primary)] hover:text-white hover:bg-white/[0.04]"
            }`}
            title="Save to Library"
          >
            <Bookmark className={`w-4 h-4 inline mr-1.5 ${isSaved ? "fill-current text-indigo-400" : ""}`} />
            <span>{isSaved ? "SAVED" : "SAVE"}</span>
          </button>
        </div>
      </div>

      {/* Paper Title (Space Grotesk) */}
      <h3
        onClick={() => onOpenReader(paper)}
        className="text-lg sm:text-xl lg:text-2xl font-bold text-white font-display leading-snug cursor-pointer hover:text-[var(--color-primary-bright)] transition-colors pt-1"
      >
        {paper.title}
      </h3>

      {/* Authors List */}
      <p className="text-sm sm:text-base text-slate-300 font-sans">
        {authorsDisplay}
      </p>

      {/* Abstract Text Area */}
      {paper.abstract && (
        <div className="pt-1">
          <p
            className={`text-sm sm:text-base text-slate-200 leading-relaxed font-sans ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {paper.abstract}
          </p>
          {paper.abstract.length > 280 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono text-[var(--color-primary-bright)] hover:underline font-semibold"
            >
              <span>{expanded ? "COLLAPSE" : "EXPAND ABSTRACT"}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}

      {/* Action Command Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-indigo-500/20">
        <div className="flex flex-wrap items-center gap-3">
          {/* Reader Access Button */}
          <button
            type="button"
            onClick={() => onOpenReader(paper)}
            className="btn btn-primary h-10 px-4 text-xs sm:text-sm font-mono font-bold"
          >
            <BookOpen className="w-4 h-4" />
            <span>OPEN READER</span>
          </button>

          {/* Primary Direct PDF Access */}
          {access.hasDirectPdf && access.primaryAction && (
            <a
              href={access.primaryAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-emerald h-10 px-4 text-xs sm:text-sm font-mono font-bold"
            >
              <FileText className="w-4 h-4" />
              <span>{access.primaryAction.label}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
            </a>
          )}

          {/* Verified DOI External Link */}
          {!access.hasDirectPdf && access.primaryAction && (
            <a
              href={access.primaryAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary h-10 px-4 text-xs sm:text-sm font-mono font-semibold"
            >
              <span>{access.primaryAction.label}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
            </a>
          )}
        </div>

        {/* Technical DOI / Identity Tag */}
        {paper.doi && (
          <span className="font-mono text-xs text-slate-400 truncate max-w-[260px]">
            DOI: {paper.doi}
          </span>
        )}
      </div>
    </article>
  );
}
