"use client";

import { useAppStore } from "@/store/app-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { PaperCard } from "@/components/papers/paper-card";
import { useMemo } from "react";

export function CompareView() {
  const papers = useAppStore((s) => s.papers);
  const savedIds = useAppStore((s) => s.savedIds);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const setView = useAppStore((s) => s.setView);

  // Build compare list from current results + saved papers
  const comparePapers = useMemo(() => {
    const fromResults = papers.filter((p) => compareIds.has(p.id));
    return fromResults;
  }, [papers, compareIds]);

  // Also check saved papers if not in current results
  const savedPapers = useAppStore.getState();
  // We need to also fetch saved papers to compare them. For simplicity,
  // show only papers from the current search results that are in compareIds.

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
            {comparePapers.length} paper{comparePapers.length === 1 ? "" : "s"} selected for side-by-side comparison
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
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2 text-red-600 hover:text-red-700"
                        onClick={() => toggleCompare(p.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="Authors" icon={Users} render={(p) => p.authors.join(", ") || "—"} papers={comparePapers} />
              <CompareRow label="Year" icon={Calendar} render={(p) => p.year?.toString() || "—"} papers={comparePapers} />
              <CompareRow label="Citations" icon={Quote} render={(p) => p.citationCount.toLocaleString()} papers={comparePapers} />
              <CompareRow label="Publisher / Venue" icon={Award} render={(p) => p.publisher || p.venue || "—"} papers={comparePapers} />
              <CompareRow label="Paper Type" icon={FileText} render={(p) => p.paperType || "—"} papers={comparePapers} />
              <CompareRow label="Open Access" icon={Sparkles} render={(p) => p.openAccess ? "Yes" : "No"} papers={comparePapers} />
              <CompareRow label="Relevance Score" icon={Sparkles} render={(p) => p.relevanceScore?.toString() || "—"} papers={comparePapers} />
              <CompareRow label="DOI" icon={FileText} render={(p) => p.doi || "—"} papers={comparePapers} />
              <CompareRow label="Keywords" icon={FileText} render={(p) => p.keywords.slice(0, 5).join(", ") || "—"} papers={comparePapers} />
              <CompareRow label="Abstract" icon={BookOpen} render={(p) => (
                <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap">
                  {p.abstract}
                </div>
              )} papers={comparePapers} />
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

function CompareRow({
  label,
  icon: Icon,
  render,
  papers,
}: {
  label: string;
  icon: React.ElementType;
  render: (p: import("@/lib/academic/types").AcademicPaper) => React.ReactNode;
  papers: import("@/lib/academic/types").AcademicPaper[];
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3 font-medium text-muted-foreground sticky left-0 bg-background z-10 align-top">
        <span className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
      </td>
      {papers.map((p) => (
        <td key={p.id} className="p-3 align-top">
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
