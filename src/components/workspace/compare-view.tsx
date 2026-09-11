"use client";

import type { ReactNode } from "react";
import {
  Scale,
  X,
  ExternalLink,
  BookOpen,
  Trash2,
  Compass,
  ArrowRight,
  FileText,
} from "lucide-react";
import type { Evidence } from "@/lib/workspace/schema";
import { fields } from "@/lib/workspace/schema";
import type { Paper } from "./paper-card";
import { resolvePaperAccess } from "./source-resolver";

interface CompareViewProps {
  comparedPapers: Paper[];
  onRemovePaper: (paperId: string) => void;
  onClearAll: () => void;
  onOpenReader: (paper: Paper) => void;
  onNavigateToDiscover: () => void;
  evidenceList: Evidence[];
}

/**
 * KIVO Compare — "The Scholar's Atelier" differential matrix.
 * Side-by-side weigh of methodology, evidence, and citation impact
 * across up to eight records. Terracotta (coral) is the compare accent.
 */
export function CompareView({
  comparedPapers,
  onRemovePaper,
  onClearAll,
  onOpenReader,
  onNavigateToDiscover,
  evidenceList,
}: CompareViewProps) {
  // ---------------------------------------------------------------- EMPTY
  if (comparedPapers.length === 0) {
    return (
      <div className="tech-card bracketed p-12 sm:p-16 text-center max-w-2xl mx-auto space-y-5 animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--border-coral-dim)] bg-[rgba(217,119,87,0.08)] text-[var(--color-coral)] shadow-[0_0_24px_var(--color-coral-glow)]">
          <Scale className="h-8 w-8" />
        </div>
        <div className="space-y-2.5">
          <h3
            className="text-2xl sm:text-3xl font-bold font-display text-[var(--text-primary)] leading-tight"
            style={{ fontOpticalSizing: "auto" }}
          >
            Comparison studio is{" "}
            <span className="font-serif-italic text-[var(--color-coral)]">
              empty.
            </span>
          </h3>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
            Toggle &ldquo;Compare&rdquo; on any paper in Discover or your
            Library to weigh their methodologies, captured evidence, and
            citation impact side-by-side.
          </p>
        </div>
        <div className="pt-3">
          <button
            type="button"
            onClick={onNavigateToDiscover}
            className="btn btn-primary h-11 px-6 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <Compass className="w-4 h-4" />
            <span>Discover papers</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------- evidence per paper + field
  const evidenceByPaper = new Map<string, Map<string, number>>();
  for (const e of evidenceList) {
    if (!evidenceByPaper.has(e.paperId)) {
      evidenceByPaper.set(e.paperId, new Map());
    }
    const fieldMap = evidenceByPaper.get(e.paperId)!;
    fieldMap.set(e.field, (fieldMap.get(e.field) ?? 0) + 1);
  }

  const totalEvidenceFor = (paperId: string) => {
    const m = evidenceByPaper.get(paperId);
    if (!m) return 0;
    let sum = 0;
    for (const v of m.values()) sum += v;
    return sum;
  };

  return (
    <div className="space-y-7">
      {/* ============ SECTION MASTHEAD ============ */}
      <div className="space-y-4 animate-fade-up">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="section-index">
            <span className="num">05</span> / Compare
          </span>
          <span className="h-px flex-1 bg-[var(--border-dim)] min-w-[40px]" />
          <span className="hud-badge coral py-1">
            <span className="hud-dot animate-pulse-signal" />
            {comparedPapers.length}{" "}
            {comparedPapers.length === 1 ? "PAPER" : "PAPERS"} ACTIVE
          </span>
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-display leading-[1.08] text-[var(--text-primary)]"
          style={{ fontOpticalSizing: "auto" }}
        >
          Side-by-side{" "}
          <span className="font-serif-italic text-[var(--color-coral)]">
            differential.
          </span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base max-w-2xl leading-relaxed">
          Weigh methodologies, evidence, and citation impact across up to
          eight records. Each column is a paper; each row an attribute or
          evidence field captured in your workbench.
        </p>
      </div>

      {/* ============ TOOLBAR ============ */}
      <div className="flex items-center justify-between gap-3 flex-wrap animate-fade-up">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="section-index">
            <span className="num">05.1</span> Matrix
          </span>
          <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
            {comparedPapers.length} of 8 cols · {fields.length} dimensions
          </span>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="btn btn-secondary h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider"
          title="Remove every paper from the comparison"
        >
          <Trash2 className="w-3.5 h-3.5 text-[var(--color-coral)]" />
          <span>Clear all</span>
        </button>
      </div>

      {/* ============ COMPARISON MATRIX ============ */}
      <div className="tech-card bracketed p-0 overflow-hidden animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[var(--border-medium)] bg-[var(--bg-surface-elevated)]">
                <th className="p-4 w-44 align-bottom font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Attribute · Field
                </th>
                {comparedPapers.map((p, i) => {
                  const access = resolvePaperAccess(p);
                  return (
                    <th
                      key={p.id}
                      className="p-4 min-w-[260px] max-w-[340px] align-top border-l border-[var(--border-dim)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          COL {String(i + 1).padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemovePaper(p.id)}
                          className="btn btn-ghost h-7 w-7 p-0 text-[var(--text-muted)] hover:text-[var(--color-coral)]"
                          title="Remove from comparison"
                          aria-label={`Remove ${p.title} from comparison`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <h4
                        onClick={() => onOpenReader(p)}
                        className="mt-1.5 text-base sm:text-lg font-semibold font-display leading-snug text-[var(--text-primary)] line-clamp-3 cursor-pointer hover:text-[var(--color-primary-bright)] transition-colors"
                        style={{ fontOpticalSizing: "auto" }}
                        title={p.title}
                      >
                        {p.title}
                      </h4>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenReader(p)}
                          className="btn btn-primary h-7 px-3 text-[10px] font-mono font-bold uppercase tracking-wider"
                        >
                          <BookOpen className="w-3 h-3" />
                          Reader
                        </button>
                        {access.hasDirectPdf && access.primaryAction ? (
                          <a
                            href={access.primaryAction.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-emerald h-7 px-3 text-[10px] font-mono font-bold uppercase tracking-wider"
                          >
                            <FileText className="w-3 h-3" />
                            PDF
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        ) : access.primaryAction ? (
                          <a
                            href={access.primaryAction.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary h-7 px-3 text-[10px] font-mono font-bold uppercase tracking-wider"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Source
                          </a>
                        ) : null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* Authors */}
              <MatrixRow label="Authors">
                {comparedPapers.map((p) => (
                  <MatrixCell key={p.id}>
                    <p className="text-[13px] text-[var(--text-secondary)] font-serif-italic leading-snug">
                      {p.authors.length > 0
                        ? p.authors.slice(0, 3).join(", ") +
                          (p.authors.length > 3
                            ? ` +${p.authors.length - 3}`
                            : "")
                        : "Unknown authors"}
                    </p>
                  </MatrixCell>
                ))}
              </MatrixRow>

              {/* Year + Venue */}
              <MatrixRow label="Year · Venue">
                {comparedPapers.map((p) => (
                  <MatrixCell key={p.id}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.year ? (
                        <span className="rounded-md bg-white/[0.07] border border-[var(--border-dim)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--text-primary)]">
                          {p.year}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-[var(--text-faint)]">
                          — YEAR
                        </span>
                      )}
                      {p.venue && (
                        <span
                          className="font-mono text-[11px] text-[var(--text-secondary)] truncate max-w-[180px]"
                          title={p.venue}
                        >
                          {p.venue}
                        </span>
                      )}
                    </div>
                  </MatrixCell>
                ))}
              </MatrixRow>

              {/* Citations */}
              <MatrixRow label="Citations">
                {comparedPapers.map((p) => (
                  <MatrixCell key={p.id}>
                    <span
                      className="font-display text-xl font-bold text-[var(--color-primary-bright)]"
                      style={{ fontOpticalSizing: "auto" }}
                    >
                      {p.citationCount !== null
                        ? p.citationCount.toLocaleString()
                        : "—"}
                    </span>
                    <span className="ml-1.5 font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {p.citationCount === 1 ? "cite" : "cites"}
                    </span>
                  </MatrixCell>
                ))}
              </MatrixRow>

              {/* Access */}
              <MatrixRow label="Access">
                {comparedPapers.map((p) => {
                  const access = resolvePaperAccess(p);
                  return (
                    <MatrixCell key={p.id}>
                      <span
                        className={`hud-badge ${
                          access.accessBadge.variant === "emerald"
                            ? "green"
                            : "brass"
                        } py-1 px-2.5 text-[10px]`}
                        title={access.accessBadge.tooltip}
                      >
                        {access.hasDirectPdf && (
                          <span className="hud-dot" />
                        )}
                        {access.accessBadge.label}
                      </span>
                    </MatrixCell>
                  );
                })}
              </MatrixRow>

              {/* Divider row — evidence by field */}
              <tr>
                <td
                  colSpan={comparedPapers.length + 1}
                  className="px-4 py-3 bg-[var(--bg-obsidian)]/60 border-y border-[var(--border-dim)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="section-index">
                      <span className="num">05.2</span> Evidence by field
                    </span>
                    <span className="h-px flex-1 bg-[var(--border-dim)]" />
                    <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      {fields.length} dimensions
                    </span>
                  </div>
                </td>
              </tr>

              {/* Field rows */}
              {fields.map((field, idx) => (
                <tr
                  key={field}
                  className="border-b border-[var(--border-dim)] last:border-b-0 hover:bg-white/[0.015] transition-colors"
                >
                  <td className="p-4 align-middle bg-[var(--bg-obsidian)]/40 border-r border-[var(--border-dim)]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[var(--text-faint)]">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-bright)]">
                        {field}
                      </span>
                    </div>
                  </td>
                  {comparedPapers.map((p) => {
                    const count =
                      evidenceByPaper.get(p.id)?.get(field) ?? 0;
                    return (
                      <td
                        key={p.id}
                        className="p-4 align-middle border-l border-[var(--border-dim)]"
                      >
                        {count > 0 ? (
                          <span
                            className="inline-flex items-center gap-2 rounded-md bg-[rgba(107,168,136,0.08)] border border-[var(--border-emerald-dim)] px-2 py-1"
                            title={`${count} evidence ${count === 1 ? "item" : "items"} for ${p.title} · ${field}`}
                          >
                            <span className="h-2 w-2 rounded-full bg-[var(--color-green-bright)] shadow-[0_0_8px_var(--color-green-glow)]" />
                            <span className="font-mono text-sm font-bold text-[var(--color-green-bright)]">
                              {count}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                              {count === 1 ? "note" : "notes"}
                            </span>
                          </span>
                        ) : (
                          <span className="font-mono text-base text-[var(--text-faint)]">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Total row */}
              <tr className="border-t-2 border-[var(--border-primary-dim)] bg-[var(--bg-surface-elevated)]/50">
                <td className="p-4 align-middle bg-[var(--bg-obsidian)]/50 border-r border-[var(--border-dim)]">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-bright)]">
                    Total evidence
                  </span>
                </td>
                {comparedPapers.map((p) => {
                  const total = totalEvidenceFor(p.id);
                  return (
                    <td
                      key={p.id}
                      className="p-4 align-middle border-l border-[var(--border-dim)]"
                    >
                      <span className="inline-flex items-baseline gap-1.5">
                        <span
                          className="font-display text-lg font-bold text-[var(--color-primary-bright)]"
                          style={{ fontOpticalSizing: "auto" }}
                        >
                          {total}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          {total === 1 ? "note" : "notes"}
                        </span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ PROVENANCE FOOTER ============ */}
      <p className="flex items-start gap-2 font-mono text-[10px] text-[var(--text-muted)] leading-relaxed max-w-3xl">
        <Scale className="w-3.5 h-3.5 text-[var(--color-coral)] shrink-0 mt-0.5" />
        Matrix reflects evidence captured in the workbench per field. Empty
        cells indicate no notes yet — open the reader to extract author
        passages or write researcher notes against each field.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- helpers

function MatrixRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <tr className="border-b border-[var(--border-dim)]">
      <td className="p-4 align-middle bg-[var(--bg-obsidian)]/40 border-r border-[var(--border-dim)] font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </td>
      {children}
    </tr>
  );
}

function MatrixCell({ children }: { children: ReactNode }) {
  return (
    <td className="p-4 align-middle border-l border-[var(--border-dim)] text-[var(--text-secondary)]">
      {children}
    </td>
  );
}
