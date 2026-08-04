"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Quote,
  GitCompareArrows,
  Bookmark,
  Network as NetworkIcon,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AcademicPaper, CitationNeighbor } from "@/lib/academic/types";
import { useAppStore } from "@/store/app-store";
import { toggleSavePaper } from "@/lib/actions";
import { toast } from "sonner";

interface CitationNetworkProps {
  paper: AcademicPaper;
}

export function CitationNetwork({ paper }: CitationNetworkProps) {
  const [references, setReferences] = useState<CitationNeighbor[]>([]);
  const [citations, setCitations] = useState<CitationNeighbor[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingCites, setLoadingCites] = useState(true);
  const setView = useAppStore((s) => s.setView);
  const setNetworkGraph = useAppStore((s) => s.setNetworkGraph);
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const savedIds = useAppStore((s) => s.savedIds);

  useEffect(() => {
    let cancelled = false;
    setLoadingRefs(true);
    setLoadingCites(true);
    setReferences([]);
    setCitations([]);

    // Fetch references (papers THIS paper cites)
    fetch(
      `/api/citations?paperId=${encodeURIComponent(paper.id)}&title=${encodeURIComponent(paper.title)}&type=refs`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setReferences(data.references || []);
      })
      .catch(() => {
        if (!cancelled) setReferences([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRefs(false);
      });

    // Fetch citations (papers that cite THIS paper)
    fetch(
      `/api/citations?paperId=${encodeURIComponent(paper.id)}&title=${encodeURIComponent(paper.title)}&type=cites`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCitations(data.citations || []);
      })
      .catch(() => {
        if (!cancelled) setCitations([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCites(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paper.id, paper.title]);

  const openNetwork = () => {
    // Reset the network graph so NetworkView rebuilds from current results
    setNetworkGraph(null);
    setView("network");
  };

  return (
    <div className="space-y-4">
      {/* References */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Papers This Paper Cites
            {!loadingRefs && (
              <Badge variant="outline" className="text-xs">{references.length}</Badge>
            )}
          </h2>
          <Button variant="outline" size="sm" onClick={openNetwork} className="gap-1.5">
            <NetworkIcon className="h-3.5 w-3.5" />
            Explore Network
          </Button>
        </div>
        {loadingRefs ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : references.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No references found — this paper may not be in Semantic Scholar, or its references aren't indexed.
          </p>
        ) : (
          <div className="space-y-2">
            {references.slice(0, 8).map((r) => (
              <NeighborCard key={r.paperId} neighbor={r} inCompare={compareIds.has(r.paperId)} onToggleCompare={() => toggleCompare(r.paperId)} isSaved={savedIds.has(r.paperId)} />
            ))}
            {references.length > 8 && (
              <p className="text-xs text-muted-foreground pt-1">+ {references.length - 8} more — open the network to see all.</p>
            )}
          </div>
        )}
      </Card>

      {/* Citations */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Papers That Cite This Paper
            {!loadingCites && (
              <Badge variant="outline" className="text-xs">{citations.length}</Badge>
            )}
          </h2>
        </div>
        {loadingCites ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : citations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No citing papers found — this paper may not be in Semantic Scholar, or it has no indexed citations yet.
          </p>
        ) : (
          <div className="space-y-2">
            {citations.slice(0, 8).map((c) => (
              <NeighborCard key={c.paperId} neighbor={c} inCompare={compareIds.has(c.paperId)} onToggleCompare={() => toggleCompare(c.paperId)} isSaved={savedIds.has(c.paperId)} />
            ))}
            {citations.length > 8 && (
              <p className="text-xs text-muted-foreground pt-1">+ {citations.length - 8} more.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function NeighborCard({
  neighbor,
  inCompare,
  onToggleCompare,
  isSaved,
}: {
  neighbor: CitationNeighbor;
  inCompare: boolean;
  onToggleCompare: () => void;
  isSaved: boolean;
}) {
  const handleSave = async () => {
    const paper: AcademicPaper = {
      id: neighbor.paperId || neighbor.doi || neighbor.title.slice(0, 60),
      title: neighbor.title,
      authors: neighbor.authors,
      abstract: neighbor.abstract,
      year: neighbor.year,
      doi: neighbor.doi,
      pdfLink: neighbor.openAccessPdf,
      citationCount: neighbor.citationCount,
      publisher: neighbor.venue,
      sources: ["Semantic Scholar"],
      sourceUrls: neighbor.paperId
        ? [{ source: "Semantic Scholar", url: `https://www.semanticscholar.org/paper/${neighbor.paperId}` }]
        : [],
      keywords: [],
      openAccess: !!neighbor.openAccessPdf,
      paperType: null,
      venue: neighbor.venue,
    };
    try {
      await toggleSavePaper(paper);
      toast.success(isSaved ? "Removed from library" : "Saved to library");
    } catch {
      toast.error("Failed to save paper");
    }
  };

  return (
    <div className="rounded-md border border-border p-3 hover:bg-muted/30 transition">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-medium text-sm leading-snug flex-1 line-clamp-2">{neighbor.title}</h3>
        {neighbor.openAccessPdf && (
          <a
            href={neighbor.openAccessPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
          >
            PDF
          </a>
        )}
      </div>
      {neighbor.authors.length > 0 && (
        <p className="text-xs text-muted-foreground mb-1.5 truncate">
          {neighbor.authors.slice(0, 3).join(", ")}
          {neighbor.authors.length > 3 ? ` +${neighbor.authors.length - 3}` : ""}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        {neighbor.year && <span>{neighbor.year}</span>}
        {neighbor.citationCount > 0 && (
          <span className="flex items-center gap-1">
            <Quote className="h-3 w-3" />
            {neighbor.citationCount.toLocaleString()}
          </span>
        )}
        {neighbor.venue && <span className="truncate">{neighbor.venue}</span>}
        {neighbor.doi && (
          <a
            href={`https://doi.org/${neighbor.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
          >
            <ExternalLink className="h-3 w-3" />
            DOI
          </a>
        )}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleSave}>
          <Bookmark className={`h-3 w-3 ${isSaved ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
          {isSaved ? "Saved" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onToggleCompare}>
          <GitCompareArrows className={`h-3 w-3 ${inCompare ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
          {inCompare ? "In compare" : "Compare"}
        </Button>
      </div>
    </div>
  );
}
