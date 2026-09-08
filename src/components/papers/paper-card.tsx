"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";
import { toggleSavePaper } from "@/lib/actions";
import { type AcademicPaper } from "@/lib/academic/types";
import { SaveToCollection } from "@/components/papers/save-to-collection";
import {
  Bookmark,
  BookmarkCheck,
  FileText,
  ExternalLink,
  Quote,
  GitCompareArrows,
  Calendar,
  Users,
  Award,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PaperCardProps {
  paper: AcademicPaper;
  /** When true, render a compact one-line variant. */
  compact?: boolean;
  /** Optional max citations in current result set — legacy metadata */
  maxCitationsInResults?: number;
  /** Optional total papers in results — legacy metadata */
  totalInResults?: number;
}

export function PaperCard({
  paper,
  compact = false,
}: PaperCardProps) {
  const setSelectedPaper = useAppStore((s) => s.setSelectedPaper);
  const setView = useAppStore((s) => s.setView);
  const savedIds = useAppStore((s) => s.savedIds);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const setSelectedAuthorName = useAppStore((s) => s.setSelectedAuthorName);
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

  const openAuthor = (name: string) => {
    setSelectedAuthorName(name);
    setView("author");
  };

  const score = paper.relevanceScore;

  if (compact) {
    return (
      <Card
        onClick={openDetails}
        className="p-3.5 cursor-pointer rounded-[2px] border-border bg-surface hover:border-border-2 shadow-none transition duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base font-normal line-clamp-2 text-text-primary hover:text-accent">
              {paper.title}
            </h3>
            <p className="font-mono text-xs text-text-tertiary mt-1 truncate">
              {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
              {paper.year ? ` · ${paper.year}` : ""}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      onClick={openDetails}
      className="p-6 cursor-pointer rounded-[2px] border-border bg-surface hover:border-border-2 shadow-none transition duration-150 group"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex flex-wrap gap-1.5">
          {paper.sources.map((src) => (
            <span
              key={src}
              className="inline-flex items-center rounded-[2px] border border-border-2 bg-transparent px-1.5 py-0.5 font-mono text-[0.65rem] uppercase text-text-secondary"
            >
              {src}
            </span>
          ))}
          {paper.openAccess && (
            <Badge variant="outline" className="text-[0.65rem] border-provenance text-provenance bg-transparent font-mono uppercase">
              Open Access
            </Badge>
          )}
        </div>
        {typeof score === "number" && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="h-1 rounded-full bg-border-2 w-14 overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="font-mono text-xs text-text-tertiary tabular-nums">{score}</span>
          </div>
        )}
      </div>

      <h3 className="font-display text-xl font-normal leading-snug text-text-primary group-hover:text-accent transition duration-150 mb-2">
        {paper.title}
      </h3>

      {paper.authors.length > 0 && (
        <div className="flex items-center gap-1.5 font-ui text-xs text-text-secondary font-light mb-2.5">
          <Users className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
          <span className="truncate">
            {paper.authors.slice(0, 4).map((name, i) => (
              <span key={i}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openAuthor(name);
                  }}
                  className="hover:text-accent hover:underline"
                >
                  {name}
                </button>
                {i < Math.min(paper.authors.length, 4) - 1 && ", "}
              </span>
            ))}
            {paper.authors.length > 4 ? ` +${paper.authors.length - 4} more` : ""}
          </span>
        </div>
      )}

      <p className="font-ui text-sm text-text-secondary font-light line-clamp-3 leading-relaxed mb-3.5">
        {paper.abstract}
      </p>

      {/* Metadata: year, citation count, DOI */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.7rem] text-text-tertiary mb-4">
        {paper.year && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {paper.year}
          </span>
        )}
        {(paper.citationCount ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <Quote className="h-3 w-3" />
            {(paper.citationCount?.toLocaleString() ?? "Unknown")} citations
          </span>
        )}
        {paper.publisher && (
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{paper.publisher}</span>
          </span>
        )}
        {paper.doi && (
          <span className="flex items-center gap-1 text-link hover:underline">
            <FileText className="h-3 w-3" />
            DOI: {paper.doi}
          </span>
        )}
      </div>

      {paper.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {paper.keywords.slice(0, 5).map((k) => (
            <span
              key={k}
              className="rounded-[2px] border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.65rem] text-text-tertiary uppercase"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-border" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSave}
          disabled={saving}
          className="h-7 text-xs font-mono lowercase tracking-normal"
        >
          {saving ? (
            <span className="tracking-widest">···</span>
          ) : isSaved ? (
            <>
              <BookmarkCheck className="h-3 w-3 text-provenance" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Bookmark className="h-3 w-3" />
              <span>Save</span>
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCompare}
          className={`h-7 text-xs font-mono lowercase tracking-normal ${inCompare ? "border-accent text-accent" : ""}`}
        >
          <GitCompareArrows className="h-3 w-3" />
          <span>{inCompare ? "In compare" : "Compare"}</span>
        </Button>
        <SaveToCollection paper={paper} compact />
        {paper.pdfLink && (
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-7 text-xs font-mono lowercase tracking-normal"
          >
            <a href={paper.pdfLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 text-link" />
              <span>PDF</span>
            </a>
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={openDetails}
          className="h-7 ml-auto text-link hover:text-accent font-ui uppercase tracking-wider text-[0.7rem]"
        >
          Details
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
