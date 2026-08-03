"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { toggleSavePaper } from "@/lib/actions";
import type { AcademicPaper } from "@/lib/academic/types";
import {
  Bookmark,
  BookmarkCheck,
  FileText,
  ExternalLink,
  Quote,
  GitCompareArrows,
  Loader2,
  Sparkles,
  Calendar,
  Users,
  Award,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SOURCE_COLORS: Record<string, string> = {
  "Semantic Scholar": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "arXiv": "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30",
  "Crossref": "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "PubMed": "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "CORE": "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
};

interface PaperCardProps {
  paper: AcademicPaper;
  /** When true, render a compact one-line variant. */
  compact?: boolean;
}

export function PaperCard({ paper, compact = false }: PaperCardProps) {
  const setSelectedPaper = useAppStore((s) => s.setSelectedPaper);
  const setView = useAppStore((s) => s.setView);
  const savedIds = useAppStore((s) => s.savedIds);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const [saving, setSaving] = useState(false);

  const isSaved = savedIds.has(paper.id);
  const inCompare = compareIds.has(paper.id);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    try {
      const saved = await toggleSavePaper(paper);
      toast.success(saved ? "Paper saved to library" : "Paper removed from library");
    } catch {
      toast.error("Failed to save paper");
    } finally {
      setSaving(false);
    }
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompare(paper.id);
    toast.success(inCompare ? "Removed from compare" : "Added to compare");
  };

  const openDetails = () => {
    setSelectedPaper(paper);
    setView("details");
  };

  if (compact) {
    return (
      <Card
        onClick={openDetails}
        className="p-3 cursor-pointer hover:border-emerald-500/40 hover:shadow-sm transition"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2">{paper.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
              {paper.year ? ` · ${paper.year}` : ""}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      onClick={openDetails}
      className="p-5 cursor-pointer hover:border-emerald-500/40 hover:shadow-md transition group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex flex-wrap gap-1.5">
          {paper.sources.map((src) => (
            <span
              key={src}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[src] || "bg-muted text-muted-foreground border-border"}`}
            >
              {src}
            </span>
          ))}
          {paper.openAccess && (
            <Badge variant="outline" className="text-xs bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              Open Access
            </Badge>
          )}
        </div>
        {typeof paper.relevanceScore === "number" && (
          <div className="shrink-0 flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="h-3 w-3" />
            {paper.relevanceScore}
          </div>
        )}
      </div>

      <h3 className="font-semibold text-base leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition mb-2">
        {paper.title}
      </h3>

      {paper.authors.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {paper.authors.slice(0, 4).join(", ")}
            {paper.authors.length > 4 ? ` +${paper.authors.length - 4} more` : ""}
          </span>
        </div>
      )}

      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
        {paper.abstract}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
        {paper.year && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {paper.year}
          </span>
        )}
        {paper.citationCount > 0 && (
          <span className="flex items-center gap-1">
            <Quote className="h-3 w-3" />
            {paper.citationCount.toLocaleString()} citations
          </span>
        )}
        {paper.publisher && (
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{paper.publisher}</span>
          </span>
        )}
        {paper.doi && (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            DOI: {paper.doi}
          </span>
        )}
      </div>

      {paper.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {paper.keywords.slice(0, 5).map((k) => (
            <span key={k} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {k}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={saving}
          className="h-8 gap-1.5"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isSaved ? (
            <>
              <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : (
            <>
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCompare}
          className={`h-8 gap-1.5 ${inCompare ? "text-emerald-600 dark:text-emerald-400" : ""}`}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{inCompare ? "In compare" : "Compare"}</span>
        </Button>
        {paper.pdfLink && (
          <Button
            size="sm"
            variant="ghost"
            asChild
            className="h-8 gap-1.5"
          >
            <a href={paper.pdfLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={openDetails}
          className="h-8 gap-1.5 ml-auto text-emerald-600 dark:text-emerald-400"
        >
          Details
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
