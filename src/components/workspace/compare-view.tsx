"use client";

import { Scale, X, ExternalLink, BookOpen, Trash2, Compass, ArrowRight } from "lucide-react";
import type { Workspace, Evidence } from "@/lib/workspace/schema";
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

export function CompareView({
  comparedPapers,
  onRemovePaper,
  onClearAll,
  onOpenReader,
  onNavigateToDiscover,
  evidenceList,
}: CompareViewProps) {
  if (comparedPapers.length === 0) {
    return (
      <div className="tech-card bracketed p-16 text-center max-w-xl mx-auto space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.3)]">
          <Scale className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white font-display">
            Comparison Studio is Empty
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Click &ldquo;Compare&rdquo; on any paper in Discover or your Library to contrast their methodologies, findings, and citation records side-by-side.
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
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Deck */}
      <div className="space-y-5">
        <div className="hud-badge purple py-1.5 px-4 text-xs sm:text-sm font-mono tracking-wider font-semibold">
          <span className="hud-dot animate-pulse-signal" />
          <span>DIFFERENTIAL MATRIX // {comparedPapers.length} PAPERS ACTIVE</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-display">
              Literature <span className="text-[var(--color-purple)]">Comparison</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
              Side-by-side cross-sectional comparison of empirical methods, citation impact, and key claims.
            </p>
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="btn btn-secondary h-8 px-3 text-xs font-mono text-rose-300 hover:border-rose-500"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>CLEAR MATRIX</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="tech-card bracketed p-0 overflow-x-auto border-indigo-500/20 shadow-xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-indigo-500/20 bg-[#070c1e] font-mono">
              <th className="p-5 w-48 font-bold uppercase tracking-wider text-xs sm:text-sm text-slate-300">
                Attribute
              </th>
              {comparedPapers.map((p) => {
                const access = resolvePaperAccess(p);
                return (
                  <th
                    key={p.id}
                    className="p-5 min-w-[320px] max-w-[380px] align-top border-l border-indigo-500/20"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-base sm:text-lg text-white font-display leading-snug">
                        {p.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onRemovePaper(p.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                        title="Remove paper"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="mt-3.5 flex items-center gap-2.5 font-mono text-xs sm:text-sm">
                      <button
                        type="button"
                        onClick={() => onOpenReader(p)}
                        className="btn btn-primary h-8 px-3 text-xs font-semibold"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>READER</span>
                      </button>
                      {access.primaryAction && (
                        <a
                          href={access.primaryAction.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary h-8 px-3 text-xs font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[var(--color-primary-bright)]" />
                          <span>SOURCE</span>
                        </a>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-500/15 text-slate-200">
            {/* Authors */}
            <tr>
              <td className="p-5 font-mono font-bold text-slate-400 uppercase text-xs sm:text-sm bg-[var(--bg-obsidian)]/50">
                Authors
              </td>
              {comparedPapers.map((p) => (
                <td key={p.id} className="p-5 border-l border-indigo-500/15 align-top text-sm text-slate-300">
                  {p.authors.join(", ") || "—"}
                </td>
              ))}
            </tr>

            {/* Publication */}
            <tr>
              <td className="p-5 font-mono font-bold text-slate-400 uppercase text-xs sm:text-sm bg-[var(--bg-obsidian)]/50">
                Publication
              </td>
              {comparedPapers.map((p) => (
                <td key={p.id} className="p-5 border-l border-indigo-500/15 align-top">
                  <span className="font-mono font-bold text-white text-sm">
                    {p.year || "Year unknown"}
                  </span>
                  {p.venue && (
                    <span className="block text-slate-400 pt-1 text-sm font-medium">
                      {p.venue}
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Impact & Access */}
            <tr>
              <td className="p-5 font-mono font-bold text-slate-400 uppercase text-xs sm:text-sm bg-[var(--bg-obsidian)]/50">
                Citations & Access
              </td>
              {comparedPapers.map((p) => {
                const access = resolvePaperAccess(p);
                return (
                  <td key={p.id} className="p-5 border-l border-indigo-500/15 align-top space-y-2 font-mono">
                    <div>
                      <span className="font-bold text-indigo-400 text-base">
                        {p.citationCount !== null ? p.citationCount.toLocaleString() : "—"}
                      </span>{" "}
                      <span className="text-slate-400 text-xs sm:text-sm">citations</span>
                    </div>
                    <div>
                      <span className="hud-badge green py-0.5 px-2 text-xs font-semibold">
                        {access.accessBadge.label}
                      </span>
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Abstract */}
            <tr>
              <td className="p-5 font-mono font-bold text-slate-400 uppercase text-xs sm:text-sm bg-[var(--bg-obsidian)]/50">
                Abstract & Claims
              </td>
              {comparedPapers.map((p) => (
                <td
                  key={p.id}
                  className="p-5 border-l border-indigo-500/15 align-top text-sm text-slate-200 leading-relaxed max-w-[380px]"
                >
                  <p className="line-clamp-6">{p.abstract || "No abstract available."}</p>
                </td>
              ))}
            </tr>

            {/* Workspace Evidence */}
            <tr>
              <td className="p-5 font-mono font-bold text-slate-400 uppercase text-xs sm:text-sm bg-[var(--bg-obsidian)]/50">
                Captured Evidence
              </td>
              {comparedPapers.map((p) => {
                const paperEv = evidenceList.filter((e) => e.paperId === p.id);
                return (
                  <td key={p.id} className="p-4 border-l border-[var(--border-dim)] align-top space-y-2">
                    {paperEv.length === 0 ? (
                      <span className="text-[var(--text-muted)] text-xs font-mono italic">
                        No notes captured yet
                      </span>
                    ) : (
                      paperEv.map((ev) => (
                        <div
                          key={ev.id}
                          className="rounded bg-white/[0.03] border border-[var(--border-dim)] p-2.5 text-xs"
                        >
                          <span className="text-[10px] font-mono uppercase text-[var(--color-primary-bright)] block mb-1">
                            {ev.field}
                          </span>
                          <p className="text-slate-200">{ev.statement}</p>
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
