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
  Quote,
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
      className={`paper-card bracketed space-y-3.5 transition-all ${
        isSaved ? "border-[var(--border-primary-dim)] bg-[rgba(58, 157, 124,0.05)]" : ""
      }`}
    >
      {/* Top metadata strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          {paper.year && (
            <span className="rounded-md bg-white/[0.07] border border-[var(--border-dim)] px-2 py-0.5 text-[var(--text-primary)] font-bold tracking-wide">
              {paper.year}
            </span>
          )}
          {paper.venue && (
            <span
              className="max-w-[280px] truncate rounded-md bg-white/[0.03] border border-[var(--border-dim)] px-2 py-0.5 text-[var(--text-secondary)] font-medium"
              title={paper.venue}
            >
              {paper.venue}
            </span>
          )}
          {paper.citationCount !== null && (
            <span className="hud-badge brass py-1 px-2.5 text-[10px]">
              <span className="hud-dot" />
              <span>{paper.citationCount} {paper.citationCount === 1 ? "CITE" : "CITES"}</span>
            </span>
          )}
          <span
            className={`hud-badge ${
              access.accessBadge.variant === "emerald" ? "green" : "brass"
            } py-1 px-2.5 text-[10px]`}
            title={access.accessBadge.tooltip}
          >
            {access.hasDirectPdf && <span className="hud-dot" />}
            <span>{access.accessBadge.label}</span>
          </span>
          {hasIntegrityWarning && (
            <span className="hud-badge red py-1 px-2.5 text-[10px]" title="Paper retracted or flagged">
              <AlertTriangle className="w-3 h-3" />
              <span>FLAGGED</span>
            </span>
          )}
        </div>

        {/* Quick toggles */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {onAddToProject && (
            <button
              type="button"
              onClick={() => onAddToProject(paper)}
              className="rounded-md border border-[var(--border-dim)] p-1.5 text-[var(--text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--text-primary)] hover:bg-[rgba(58, 157, 124,0.05)] transition-colors"
              title="Add to screening project"
              aria-label="Add to project"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleCompare(paper)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
              isCompared
                ? "border-[var(--color-coral)] bg-[rgba(217,119,87,0.18)] text-[var(--text-primary)] shadow-[0_0_12px_rgba(217,119,87,0.28)]"
                : "border-[var(--border-dim)] text-[var(--text-secondary)] hover:border-[var(--color-coral)] hover:text-[var(--text-primary)] hover:bg-[rgba(217,119,87,0.05)]"
            }`}
            title="Compare side-by-side"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isCompared ? "COMPARING" : "COMPARE"}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleSave(paper)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
              isSaved
                ? "border-[var(--color-primary)] bg-[rgba(58, 157, 124,0.18)] text-[var(--text-primary)] shadow-[0_0_12px_rgba(58, 157, 124,0.28)]"
                : "border-[var(--border-dim)] text-[var(--text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--text-primary)] hover:bg-[rgba(58, 157, 124,0.05)]"
            }`}
            title="Save to library"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current text-[var(--color-primary-bright)]" : ""}`} />
            <span>{isSaved ? "SAVED" : "SAVE"}</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <h3
        onClick={() => onOpenReader(paper)}
        className="text-lg sm:text-xl lg:text-[1.35rem] font-semibold text-[var(--text-primary)] font-display leading-snug cursor-pointer hover:text-[var(--color-primary-bright)] transition-colors pt-0.5"
        style={{ fontOpticalSizing: "auto" }}
      >
        {paper.title}
      </h3>

      {/* Authors */}
      <p className="text-sm text-[var(--text-secondary)] font-sans italic font-serif-italic">
        {authorsDisplay}
      </p>

      {/* Abstract */}
      {paper.abstract && (
        <div className="pt-0.5">
          <p
            className={`text-[13.5px] sm:text-sm text-[var(--text-secondary)] leading-relaxed font-sans ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {paper.abstract}
          </p>
          {paper.abstract.length > 280 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-primary-bright)] hover:underline font-semibold uppercase tracking-wider"
            >
              <span>{expanded ? "Collapse" : "Expand Abstract"}</span>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-[var(--border-dim)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onOpenReader(paper)}
            className="btn btn-primary h-9 px-3.5 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <BookOpen className="w-4 h-4" />
            <span>Open Reader</span>
          </button>
          {access.hasDirectPdf && access.primaryAction && (
            <a
              href={access.primaryAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-emerald h-9 px-3.5 text-xs font-mono font-bold uppercase tracking-wider"
            >
              <FileText className="w-4 h-4" />
              <span>{access.primaryAction.label}</span>
              <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
            </a>
          )}
          {!access.hasDirectPdf && access.primaryAction && (
            <a
              href={access.primaryAction.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary h-9 px-3.5 text-xs font-mono font-semibold uppercase tracking-wider"
            >
              <span>{access.primaryAction.label}</span>
              <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
            </a>
          )}
        </div>
        {paper.doi && (
          <span className="font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[260px] flex items-center gap-1.5">
            <Quote className="w-3 h-3 text-[var(--color-primary)]/60" />
            DOI: {paper.doi}
          </span>
        )}
      </div>
    </article>
  );
}
