"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SOURCE_BADGE_COLORS, type AcademicPaper } from "@/lib/academic/types";
import {
  GitCompareArrows,
  Trash2,
  ExternalLink,
  Calendar,
  Quote,
  Award,
  FileText,
  Users,
  Sparkles,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PaperCard } from "@/components/papers/paper-card";
import { useMemo, useState } from "react";

export function CompareView() {
  const papers = useAppStore((s) => s.papers);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const setView = useAppStore((s) => s.setView);

  // Build compare list from current results
  const comparePapers = useMemo(() => {
    return papers.filter((p) => compareIds.has(p.id));
  }, [papers, compareIds]);

  if (comparePapers.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <Card className="p-10 text-center">
          <GitCompareArrows className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No papers to compare yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Use the “Compare” button on any paper card to add it here.
            You can compare 2–4 papers side by side.
          </p>
          <Button onClick={() => setView("results")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <BookOpen className="h-4 w-4" />
            Browse results
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compare Papers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {comparePapers.length} paper{comparePapers.length === 1 ? "" : "s"} selected for side-by-side comparison.
            Winning values in each row are highlighted in green.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearCompare} className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </Button>
      </div>

      {/* Comparison table — horizontal scroll on small screens */}
      <Card className="p-0 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium p-3 sticky left-0 bg-muted/30 z-10 min-w-[140px]">
                  Attribute
                </th>
                {comparePapers.map((p) => (
                  <th key={p.id} className="text-left p-3 min-w-[260px] align-top">
                    <div className="space-y-1">
                      <div className="font-semibold leading-snug">{p.title}</div>
                      <div className="flex flex-wrap gap-1">
                        {p.sources.map((s) => (
                          <span
                            key={s}
                            className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-medium ${SOURCE_BADGE_COLORS[s] || "bg-muted text-muted-foreground border-border"}`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      {/* V2: ✕ icon button to remove from compare */}
                      <button
                        onClick={() => toggleCompare(p.id)}
                        className="inline-flex items-center gap-0.5 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Remove from compare"
                      >
                        <X className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Authors" icon={Users} render={(p) => p.authors.join(", ") || "—"} papers={comparePapers} winnerFor="authors" />
              <CompareRow label="Year" icon={Calendar} render={(p) => p.year?.toString() || "—"} papers={comparePapers} winnerFor="year" />
              <CompareRow label="Citations" icon={Quote} render={(p) => p.citationCount.toLocaleString()} papers={comparePapers} winnerFor="citations" />
              <CompareRow label="Publisher / Venue" icon={Award} render={(p) => p.publisher || p.venue || "—"} papers={comparePapers} />
              <CompareRow label="Paper Type" icon={FileText} render={(p) => p.paperType || "—"} papers={comparePapers} />
              <CompareRow label="Open Access" icon={Sparkles} render={(p) => p.openAccess ? "Yes" : "No"} papers={comparePapers} winnerFor="openAccess" />
              <CompareRow label="Relevance Score" icon={Sparkles} render={(p) => p.relevanceScore?.toString() || "—"} papers={comparePapers} winnerFor="relevance" />
              <CompareRow label="Sources Count" icon={FileText} render={(p) => p.sources.length.toString()} papers={comparePapers} winnerFor="sourcesCount" />
              <CompareRow label="DOI" icon={FileText} render={(p) => p.doi || "—"} papers={comparePapers} />
              <CompareRow label="Keywords" icon={FileText} render={(p) => p.keywords.slice(0, 5).join(", ") || "—"} papers={comparePapers} />
              <CompareRow label="Abstract" icon={BookOpen} render={(p) => <AbstractCell abstract={p.abstract} paperId={p.id} />} papers={comparePapers} />
              <CompareRow label="Links" icon={ExternalLink} render={(p) => (
                <div className="flex flex-wrap gap-1">
                  {p.sourceUrls.map((su) => (
                    <a
                      key={su.url}
                      href={su.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {su.source}
                    </a>
                  ))}
                  {p.pdfLink && (
                    <a
                      href={p.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs hover:bg-muted/70"
                    >
                      <FileText className="h-3 w-3" />
                      PDF
                    </a>
                  )}
                </div>
              )} papers={comparePapers} />
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compact card list */}
      <h2 className="font-semibold mb-3">Paper cards</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {comparePapers.map((p) => (
          <PaperCard key={p.id} paper={p} compact />
        ))}
      </div>
    </div>
  );
}

// V2: Determine the winning column index for a given attribute.
// Returns -1 if there's no clear winner (e.g. all values are identical or it's a tie).
function getWinnerIndex(attribute: string, papers: AcademicPaper[]): number {
  if (papers.length < 2) return -1;

  switch (attribute) {
    case "citations": {
      const values = papers.map((p) => p.citationCount);
      const max = Math.max(...values);
      const winners = values.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
      if (winners.length === values.length) return -1; // all identical
      return winners.length === 1 ? winners[0] : -1; // tie → no highlight
    }
    case "year": {
      const values = papers.map((p) => p.year || 0);
      const max = Math.max(...values);
      const winners = values.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
      if (winners.length === values.length) return -1;
      return winners.length === 1 ? winners[0] : -1;
    }
    case "relevance": {
      const values = papers.map((p) => p.relevanceScore ?? 0);
      const max = Math.max(...values);
      if (max === 0) return -1;
      const winners = values.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
      if (winners.length === values.length) return -1;
      return winners.length === 1 ? winners[0] : -1;
    }
    case "openAccess": {
      const values = papers.map((p) => p.openAccess);
      const allYes = values.every((v) => v);
      const allNo = values.every((v) => !v);
      if (allYes || allNo) return -1;
      const winner = values.findIndex((v) => v);
      return winner;
    }
    case "sourcesCount": {
      const values = papers.map((p) => p.sources.length);
      const max = Math.max(...values);
      const winners = values.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0);
      if (winners.length === values.length) return -1;
      return winners.length === 1 ? winners[0] : -1;
    }
    default:
      return -1;
  }
}

function CompareRow({
  label,
  icon: Icon,
  render,
  papers,
  winnerFor,
}: {
  label: string;
  icon: React.ElementType;
  render: (p: AcademicPaper) => React.ReactNode;
  papers: AcademicPaper[];
  /** Attribute key for winner highlighting */
  winnerFor?: "citations" | "year" | "relevance" | "openAccess" | "sourcesCount" | "authors";
}) {
  const winnerIdx = winnerFor ? getWinnerIndex(winnerFor, papers) : -1;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3 font-medium text-muted-foreground sticky left-0 bg-background z-10 align-top">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
      </td>
      {papers.map((p, i) => {
        const isWinner = winnerIdx === i;
        return (
          <td
            key={p.id}
            className={`p-3 align-top transition-colors ${
              isWinner ? "bg-green-500/10 border-l-2 border-green-500" : ""
            }`}
          >
            {render(p)}
          </td>
        );
      })}
    </tr>
  );
}

// V2: Abstract cell with show more / show less toggle (max 4 lines, then expandable)
function AbstractCell({ abstract, paperId }: { abstract: string; paperId: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div
        className={`text-xs text-muted-foreground whitespace-pre-wrap transition-all overflow-hidden ${
          expanded ? "max-h-96" : "max-h-20"
        }`}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: expanded ? "none" : 4,
          WebkitBoxOrient: "vertical",
        }}
      >
        {abstract}
      </div>
      {abstract.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show more
            </>
          )}
        </button>
      )}
    </div>
  );
}
